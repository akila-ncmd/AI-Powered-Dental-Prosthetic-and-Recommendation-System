"""
Measure the detection model's real performance and record it.

Runs Ultralytics validation over a labelled split and writes the results to
model_metrics.json, which the PDF report and the accuracy demo read. Nothing
in this project should state a performance figure that did not come from this
file: the numbers previously printed in the report (91.3% accuracy, mAP 0.87,
precision 0.89, recall 0.85) were hardcoded and did not match the model.

Usage:
    python evaluate_model.py --data path/to/data.yaml [--split test]
    python evaluate_model.py --data ../dental-x-ray-panoramic-3/data.yaml

The dataset is not part of this repository, so --data (or the DENTAL_DATA_YAML
environment variable) must point at a Ultralytics-format data.yaml.
"""

import argparse
import json
import os
from datetime import datetime, timezone

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_MODEL = os.path.join(BASE_DIR, "app", "model", "best.pt")
METRICS_PATH = os.path.join(BASE_DIR, "model_metrics.json")


IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp"}


def _normalise_data_yaml(data_yaml: str):
    """Return (path_to_usable_yaml, dataset_root, dataset_name).

    Roboflow exports write splits as '../test/images', which resolve relative to
    the yaml's *parent* and so break when the yaml is used directly. Rewrite
    them to absolute paths in a temporary copy rather than editing the dataset.
    """
    import tempfile

    import yaml as pyyaml

    yaml_dir = os.path.dirname(os.path.abspath(data_yaml))
    with open(data_yaml, "r", encoding="utf-8") as handle:
        config = pyyaml.safe_load(handle) or {}

    root = os.path.abspath(config.get("path") or yaml_dir)

    rewritten = False
    for key in ("train", "val", "test"):
        value = config.get(key)
        if not isinstance(value, str):
            continue
        # Roboflow writes '../test/images' relative to a nesting level that
        # does not exist once the export is unzipped, so also try the value
        # with its leading '../' segments stripped.
        stripped = value.replace("\\", "/").lstrip("./")
        while stripped.startswith("../"):
            stripped = stripped[3:]
        candidates = [
            os.path.normpath(os.path.join(root, value)),
            os.path.normpath(os.path.join(yaml_dir, value)),
            os.path.normpath(os.path.join(root, stripped)),
            os.path.normpath(os.path.join(yaml_dir, stripped)),
        ]
        resolved = next((c for c in candidates if os.path.isdir(c)), None)
        if resolved and resolved != value:
            config[key] = resolved
            rewritten = True

    config.pop("path", None)  # splits are absolute now

    if not rewritten:
        return data_yaml, root, os.path.basename(root)

    handle = tempfile.NamedTemporaryFile("w", suffix=".yaml", delete=False,
                                         encoding="utf-8")
    pyyaml.safe_dump(config, handle, sort_keys=False)
    handle.close()
    return handle.name, root, os.path.basename(root)


def _count_images(data_yaml: str, split: str) -> int:
    """Number of images in the evaluated split, or None if it cannot be read."""
    try:
        import yaml as pyyaml

        with open(data_yaml, "r", encoding="utf-8") as handle:
            config = pyyaml.safe_load(handle) or {}
        split_dir = config.get(split)
        if not split_dir or not os.path.isdir(split_dir):
            return None
        return sum(1 for name in os.listdir(split_dir)
                   if os.path.splitext(name)[1].lower() in IMAGE_SUFFIXES)
    except (OSError, ValueError):
        return None


def evaluate(model_path: str, data_yaml: str, split: str = "test") -> dict:
    """Run validation and return a serialisable metrics dict."""
    from ultralytics import YOLO

    usable_yaml, _root, dataset_name = _normalise_data_yaml(data_yaml)

    model = YOLO(model_path)
    results = model.val(
        data=usable_yaml,
        split=split,
        conf=0.001,   # standard detection-benchmark setting
        iou=0.6,
        plots=False,
        verbose=True,
    )

    box = results.box
    per_class = {}
    for i, class_index in enumerate(box.ap_class_index):
        per_class[model.model.names[int(class_index)]] = {
            "mAP50": round(float(box.ap50[i]), 4),
            "precision": round(float(box.p[i]), 4),
            "recall": round(float(box.r[i]), 4),
        }

    return {
        "evaluated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "model_file": os.path.basename(model_path),
        "model_sha256_prefix": _sha256_prefix(model_path),
        "dataset": dataset_name,
        "split": split,
        "images": _count_images(usable_yaml, split),
        "overall": {
            "mAP50": round(float(box.map50), 4),
            "mAP50_95": round(float(box.map), 4),
            "precision": round(float(box.mp), 4),
            "recall": round(float(box.mr), 4),
        },
        "per_class": per_class,
    }


def _sha256_prefix(path: str, length: int = 12) -> str:
    """Short digest so a metrics file can be tied to the weights it describes."""
    import hashlib

    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()[:length]


def load_metrics(path: str = METRICS_PATH):
    """Return recorded metrics, or None if the model has not been evaluated.

    Callers must handle None by saying so - never by substituting a placeholder
    number.
    """
    try:
        with open(path, "r", encoding="utf-8") as handle:
            return json.load(handle)
    except (OSError, ValueError):
        return None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", default=DEFAULT_MODEL, help="path to the .pt weights")
    parser.add_argument("--data", default=os.getenv("DENTAL_DATA_YAML"),
                        help="Ultralytics data.yaml (or set DENTAL_DATA_YAML)")
    parser.add_argument("--split", default="test", choices=["train", "val", "test"])
    parser.add_argument("--out", default=METRICS_PATH)
    args = parser.parse_args()

    if not args.data:
        parser.error("--data is required (or set DENTAL_DATA_YAML). "
                     "The dataset is not bundled with this repository.")

    metrics = evaluate(args.model, args.data, args.split)

    with open(args.out, "w", encoding="utf-8") as handle:
        json.dump(metrics, handle, indent=2)
        handle.write("\n")

    overall = metrics["overall"]
    print(f"\nWrote {args.out}")
    print(f"  mAP@0.5    {overall['mAP50']:.4f}")
    print(f"  mAP@0.5:95 {overall['mAP50_95']:.4f}")
    print(f"  precision  {overall['precision']:.4f}")
    print(f"  recall     {overall['recall']:.4f}")


if __name__ == "__main__":
    main()
