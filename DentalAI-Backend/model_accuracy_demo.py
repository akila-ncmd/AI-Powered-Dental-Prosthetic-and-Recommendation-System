#!/usr/bin/env python3
"""
AI Model Accuracy Demonstration for Thesis
Shows YOLO model performance metrics and sample predictions
"""

import os
import sys
import csv
import json
import cv2
import numpy as np
import matplotlib.pyplot as plt
from ultralytics import YOLO
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

METRICS_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                            "model_metrics.json")


def load_recorded_metrics(path=METRICS_PATH):
    """Return metrics measured by evaluate_model.py, or None if it never ran.

    Callers must report the absence rather than substitute a placeholder. The
    figures this script used to print (mAP 0.87, precision 0.89, recall 0.85,
    "91.3% accuracy") were hardcoded and matched nothing that was measured.
    """
    try:
        with open(path, "r", encoding="utf-8") as handle:
            return json.load(handle)
    except (OSError, ValueError):
        return None


class ModelAccuracyDemo:
    def __init__(self, model_path="app/model/best.pt", test_images_dir="app/uploads"):
        self.model_path = model_path
        self.test_images_dir = test_images_dir
        self.model = None
        self.test_images = []
        self.results = []

        # Set up plotting style
        plt.style.use('default')
        plt.rcParams['figure.figsize'] = (12, 8)
        plt.rcParams['font.size'] = 12

    def load_model(self):
        """Load the YOLO model"""
        try:
            print("Loading YOLO model...")
            self.model = YOLO(self.model_path)
            print("Model loaded successfully!")
            return True
        except Exception as e:
            print(f"Error loading model: {e}")
            return False

    def find_test_images(self):
        """Find test images in the uploads directory"""
        if not os.path.exists(self.test_images_dir):
            print(f"Warning: Test images directory not found: {self.test_images_dir}")
            return False

        image_extensions = ['.jpg', '.jpeg', '.png', '.bmp']
        self.test_images = []

        for file in os.listdir(self.test_images_dir):
            if any(file.lower().endswith(ext) for ext in image_extensions):
                self.test_images.append(os.path.join(self.test_images_dir, file))

        print(f"Found {len(self.test_images)} test images")
        return len(self.test_images) > 0

    def evaluate_model(self, max_images=10):
        """Evaluate model on test images"""
        if not self.model:
            print("Model not loaded!")
            return False

        print("Evaluating model performance...")

        total_confidence = 0
        total_detections = 0
        detection_classes = set()
        processed_images = 0

        # Evaluate on subset of images
        eval_images = self.test_images[:max_images]

        for img_path in eval_images:
            try:
                print(f"  Processing: {os.path.basename(img_path)}")

                # Run prediction
                results = self.model.predict(
                    source=img_path,
                    verbose=False,
                    conf=0.25  # Confidence threshold
                )

                self.results.append((img_path, results))

                # Extract metrics
                for r in results:
                    if hasattr(r, 'boxes') and r.boxes is not None:
                        total_detections += len(r.boxes)

                        # Get confidence scores
                        if hasattr(r.boxes, 'conf') and r.boxes.conf is not None:
                            conf_scores = r.boxes.conf.cpu().numpy()
                            total_confidence += np.mean(conf_scores) if len(conf_scores) > 0 else 0

                        # Get class names
                        if hasattr(r, 'names') and r.names:
                            for cls_id in r.boxes.cls:
                                detection_classes.add(r.names[int(cls_id)])

                processed_images += 1

            except Exception as e:
                print(f"    Warning: Error processing {os.path.basename(img_path)}: {e}")
                continue

        # Calculate metrics
        self.metrics = {
            'total_images': processed_images,
            'total_detections': total_detections,
            'avg_detections_per_image': total_detections / processed_images if processed_images > 0 else 0,
            'avg_confidence': total_confidence / processed_images if processed_images > 0 else 0,
            'detected_classes': sorted(list(detection_classes))
        }

        print("Model evaluation completed!")
        return True

    def display_accuracy_metrics(self):
        """Display accuracy metrics in a formatted way"""
        print("\n" + "="*60)
        print("YOLO DENTAL DETECTION MODEL ACCURACY REPORT")
        print("="*60)

        print("\nPERFORMANCE METRICS:")
        print(f"   • Total Images Evaluated: {self.metrics['total_images']}")
        print(f"   • Average Confidence Score: {self.metrics['avg_confidence']:.3f}")
        print(f"   • Average Detections per Image: {self.metrics['avg_detections_per_image']:.1f}")
        print(f"   • Total Detections: {self.metrics['total_detections']}")
        print(f"   • Classes Detected: {', '.join(self.metrics['detected_classes'])}")

        print("\nMODEL SPECIFICATIONS:")
        print("   • Model Type: YOLOv8n (Nano)")
        print("   • Architecture: CNN-based Object Detection")
        print("   • Input Size: 640x640 pixels")
        print("   • Confidence Threshold: 0.25")

        print("\nACCURACY INDICATORS:")
        recorded = load_recorded_metrics()
        if not recorded:
            print("   Model has not been evaluated against a labelled split.")
            print("   Run: python evaluate_model.py --data <path/to/data.yaml>")
        else:
            overall = recorded.get("overall", {})
            print(f"   • mAP@0.5     : {overall.get('mAP50', 0):.4f}")
            print(f"   • mAP@0.5:0.95: {overall.get('mAP50_95', 0):.4f}")
            print(f"   • Precision   : {overall.get('precision', 0):.4f}")
            print(f"   • Recall      : {overall.get('recall', 0):.4f}")
            print(f"   (measured on the '{recorded.get('split')}' split, "
                  f"{recorded.get('images')} images, "
                  f"{str(recorded.get('evaluated_at', ''))[:10]})")

            per_class = recorded.get("per_class", {})
            if per_class:
                print("\n   Per class (mAP@0.5 / precision / recall):")
                for name, m in sorted(per_class.items(), key=lambda kv: -kv[1]["mAP50"]):
                    print(f"     {name:<22} {m['mAP50']:.3f}  "
                          f"{m['precision']:.3f}  {m['recall']:.3f}")
                weak = sorted(n for n, m in per_class.items() if m["recall"] < 0.35)
                if weak:
                    print(f"\n   Low-recall classes (< 0.35): {', '.join(weak)}")

        print("\nTRAINING PARAMETERS (read from the checkpoint):")
        for label, value in self.read_training_args().items():
            print(f"   • {label}: {value}")

        print("\n" + "="*60)

    def read_training_args(self):
        """Pull the real training configuration out of the .pt checkpoint.

        These were previously asserted from memory (100 epochs, batch 16, Adam,
        lr 0.001, "1,200+ images") and none of them matched the actual run.
        """
        try:
            import torch
            checkpoint = torch.load(self.model_path, map_location="cpu",
                                    weights_only=False)
        except Exception as exc:
            return {"unavailable": f"could not read checkpoint ({exc})"}

        args = checkpoint.get("train_args") or {}
        if not args:
            return {"unavailable": "checkpoint contains no train_args"}

        return {
            "Epochs": args.get("epochs", "unknown"),
            "Batch Size": args.get("batch", "unknown"),
            "Optimizer": args.get("optimizer", "unknown"),
            "Initial LR": args.get("lr0", "unknown"),
            "Image Size": args.get("imgsz", "unknown"),
            "Fine-tuned From": args.get("model", "unknown"),
            "Trained On": checkpoint.get("date", "unknown"),
        }

    def show_sample_predictions(self, num_samples=3):
        """Display sample predictions with visualizations"""
        if not self.results:
            print("No results to display!")
            return

        print(f"\nShowing {min(num_samples, len(self.results))} sample predictions...")

        fig, axes = plt.subplots(1, min(num_samples, len(self.results)),
                                figsize=(15, 5))
        if num_samples == 1:
            axes = [axes]

        for i, (img_path, results) in enumerate(self.results[:num_samples]):
            # Load and display image
            img = cv2.imread(img_path)
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

            # Plot results
            axes[i].imshow(img)
            axes[i].set_title(f"Sample {i+1}: {os.path.basename(img_path)}")
            axes[i].axis('off')

            # Add detection info as text overlay
            for r in results:
                if hasattr(r, 'boxes') and r.boxes is not None:
                    boxes = r.boxes
                    for j, box in enumerate(boxes):
                        # Get box coordinates
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()

                        # Get confidence and class
                        conf = float(box.conf[0]) if hasattr(box, 'conf') else 0
                        cls_id = int(box.cls[0]) if hasattr(box, 'cls') else 0
                        cls_name = r.names[cls_id] if hasattr(r, 'names') else f"Class {cls_id}"

                        # Draw bounding box
                        rect = plt.Rectangle((x1, y1), x2-x1, y2-y1,
                                           fill=False, color='red', linewidth=2)
                        axes[i].add_patch(rect)

                        # Add label
                        axes[i].text(x1, y1-5, f"{cls_name}: {conf:.2f}",
                                   color='red', fontsize=10, weight='bold',
                                   bbox=dict(facecolor='white', alpha=0.8))

        plt.tight_layout()
        plt.show()

    def load_training_curve(self):
        """Return (epochs, val mAP@0.5) from an Ultralytics results.csv, if present."""
        candidates = [
            os.path.join(os.path.dirname(self.model_path), "results.csv"),
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "results.csv"),
        ]
        for candidate in candidates:
            if not os.path.exists(candidate):
                continue
            try:
                with open(candidate, newline="", encoding="utf-8") as handle:
                    rows = [{k.strip(): v for k, v in row.items()}
                            for row in csv.DictReader(handle)]
                if not rows:
                    continue
                key = next(k for k in rows[0] if "mAP50" in k and "95" not in k)
                epochs = [float(r.get("epoch", i)) for i, r in enumerate(rows)]
                return epochs, [float(r[key]) for r in rows]
            except (OSError, ValueError, StopIteration, KeyError):
                continue
        return None

    def create_accuracy_summary_plot(self):
        """Create a summary plot of accuracy metrics"""
        if not hasattr(self, 'metrics'):
            print("No metrics available for plotting!")
            return

        # Create a figure with subplots
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(12, 10))

        # Measured metrics only - refuse to plot placeholders.
        recorded = load_recorded_metrics()
        if not recorded:
            print("No recorded metrics - run evaluate_model.py first.")
            print("Refusing to plot placeholder values.")
            plt.close(fig)
            return

        overall = recorded["overall"]
        precision, recall = overall["precision"], overall["recall"]
        f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) else 0.0
        metrics_names = ['Precision', 'Recall', 'F1-Score', 'mAP@0.5']
        metrics_values = [precision, recall, f1, overall["mAP50"]]

        # Bar chart for main metrics
        bars = ax1.bar(metrics_names, metrics_values, color=['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728'])
        ax1.set_title('Model Performance Metrics', fontsize=14, weight='bold')
        ax1.set_ylabel('Score', fontsize=12)
        ax1.set_ylim(0, 1)
        ax1.grid(axis='y', alpha=0.3)

        # Add value labels on bars
        for bar, value in zip(bars, metrics_values):
            ax1.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.01,
                    f'{value:.2f}', ha='center', va='bottom', fontsize=10, weight='bold')

        # Real per-class mAP@0.5, sorted so weak classes are unmissable.
        per_class = recorded.get("per_class", {})
        ordered = sorted(per_class.items(), key=lambda kv: kv[1]["mAP50"])
        names = [n for n, _ in ordered]

        ax2.barh(names, [m["mAP50"] for _, m in ordered], color='#17becf')
        ax2.set_title('Per-Class mAP@0.5 (measured)', fontsize=14, weight='bold')
        ax2.set_xlabel('mAP@0.5', fontsize=12)
        ax2.set_xlim(0, 1)
        ax2.grid(axis='x', alpha=0.3)

        # Per-class recall - the axis that exposes missed pathology.
        ax3.barh(names, [m["recall"] for _, m in ordered], color='#d62728')
        ax3.set_title('Per-Class Recall (measured)', fontsize=14, weight='bold')
        ax3.set_xlabel('Recall', fontsize=12)
        ax3.set_xlim(0, 1)
        ax3.grid(axis='x', alpha=0.3)

        # Training curve comes from the run's results.csv if it is available.
        # The previous version plotted an invented loss curve and an invented
        # validation-mAP curve rising to 0.87; neither was ever measured.
        curve = self.load_training_curve()
        if curve is None:
            ax4.text(0.5, 0.5,
                     "No training log found.\n\n"
                     "Place the run's results.csv next to the model\n"
                     "to plot the real training curve.",
                     ha='center', va='center', fontsize=11, transform=ax4.transAxes)
            ax4.set_xticks([])
            ax4.set_yticks([])
            ax4.set_title('Training Progress', fontsize=14, weight='bold')
        else:
            curve_epochs, curve_values = curve
            ax4.plot(curve_epochs, curve_values, 'r-',
                     label='Validation mAP@0.5', linewidth=2)
            ax4.set_title('Validation Performance (from results.csv)',
                          fontsize=14, weight='bold')
            ax4.set_xlabel('Epoch', fontsize=12)
            ax4.set_ylabel('mAP@0.5', fontsize=12)
            ax4.legend()
            ax4.grid(alpha=0.3)

        plt.suptitle('YOLO Dental Detection Model - Performance Analysis',
                    fontsize=16, weight='bold', y=0.98)
        plt.tight_layout()
        plt.show()

    def run_demo(self):
        """Run the complete accuracy demonstration"""
        print("Starting AI Model Accuracy Demonstration")
        print("="*50)

        # Step 1: Load model
        if not self.load_model():
            return False

        # Step 2: Find test images
        if not self.find_test_images():
            print("Warning: No test images found, but continuing with demo...")
            # Create mock metrics for demonstration
            self.metrics = {
                'total_images': 0,
                'total_detections': 0,
                'avg_detections_per_image': 0,
                'avg_confidence': 0,
                'detected_classes': ['Caries', 'Missing Teeth', 'Bone Loss', 'Crown', 'Filling']
            }

        # Step 3: Evaluate model
        if not self.evaluate_model():
            print("Model evaluation failed!")
            return False

        # Step 4: Display results
        self.display_accuracy_metrics()

        # Step 5: Show sample predictions
        if self.results:
            self.show_sample_predictions()

        # Step 6: Create summary plot
        self.create_accuracy_summary_plot()

        print("\nAccuracy demonstration completed!")
        print("Take screenshots of the output above for your thesis!")

        return True

def main():
    """Main function"""
    print("Dental AI Model Accuracy Demonstration")
    print("This script demonstrates your YOLO model's performance for thesis screenshots\n")

    # Initialize demo
    demo = ModelAccuracyDemo()

    # Run demonstration
    success = demo.run_demo()

    if success:
        print("\nDemo completed successfully!")
        print("Tip: Run this script and take screenshots of the output for your thesis")
    else:
        print("\nDemo failed. Check the error messages above.")
        sys.exit(1)

if __name__ == "__main__":
    main()