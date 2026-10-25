---
title: DentalAI Platform
emoji: 🦷
colorFrom: blue
colorTo: green
sdk: docker
pinned: false
---

# AI-Powered Dental Prosthetic and Recommendation System

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.23612738.svg)](https://doi.org/10.5281/zenodo.23612738)
[![Conference](https://img.shields.io/badge/EICON%202026-Proceedings%20pp.%2036--43-blue.svg)](https://eicon.esu.lk/2026/proceedings)
[![ResearchGate](https://img.shields.io/badge/ResearchGate-Publication-00CCBB.svg?logo=researchgate)](https://www.researchgate.net/publication/416764853_AI-Powered_Dental_Prosthetic_and_Recommendation_System)
[![Google Scholar](https://img.shields.io/badge/Google%20Scholar-Profile-4285F4.svg?logo=google-scholar)](https://scholar.google.com/citations?user=SRZOPaMAAAAJ)
[![License: CC BY 4.0](https://img.shields.io/badge/License-CC_BY_4.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)
[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.13-3776AB.svg?logo=python&logoColor=white)](https://www.python.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg?logo=next.js)](https://nextjs.org/)

> Official open-source implementation and research repository for the peer-reviewed conference paper:  
> **"AI-Powered Dental Prosthetic and Recommendation System"**  
> Published in the *Proceedings of the ESOFT International Conference (EICON 2026)*, Kandy, Sri Lanka.

---

## 📌 Research Overview & Metadata

Commercial dental artificial intelligence applications (e.g., Overjet, Pearl, Denti.AI) predominantly focus on detecting dental pathology on radiographs. However, they stop short of clinical decision support: they do not determine what prosthetic treatment should be performed for a specific patient.

This system bridges that gap by integrating **automated panoramic radiograph analysis** directly with **structured clinical patient parameters** to generate transparent, explainable, and ranked prosthetic treatment recommendations.

| Field | Detail |
|---|---|
| **Title** | AI-Powered Dental Prosthetic and Recommendation System |
| **Authors** | **Nilupul H.M.** (Presenting & Corresponding Author), **Fonseka N.** (Supervisor), **Akalanka A.U.** (Co-Supervisor) |
| **Affiliation** | School of Computing, ESOFT Metro Campus, Galle, Sri Lanka / London Metropolitan University |
| **Conference** | ESOFT International Conference (EICON 2026) |
| **Venue & Date** | ESU, Kandy, Sri Lanka · August 30, 2026 |
| **Volume & Pages** | Vol. 1, pp. 36–43 (Paper ID: `FPC10`) |
| **ISSN / ISBN** | ISSN: `3121-5122` \| ISBN: `978-624-6610-01-2` |
| **Permanent DOI** | [10.5281/zenodo.23612738](https://doi.org/10.5281/zenodo.23612738) |
| **Open Access PDF** | [Download Official Full-Text (Zenodo)](https://doi.org/10.5281/zenodo.23612738) |
| **Google Scholar** | [Akila Nilupul Citations](https://scholar.google.com/citations?user=SRZOPaMAAAAJ) |
| **ResearchGate** | [Publication Record](https://www.researchgate.net/publication/416764853_AI-Powered_Dental_Prosthetic_and_Recommendation_System) |

---

## 🔬 System Architecture & Pipeline

```
  [ Panoramic Dental X-Ray (OPG) ] ────────┐
                                           ▼
                     ┌──────────────────────────────────────────┐
                     │     YOLOv8-Nano Computer Vision Model    │
                     │  10 Dental Pathology & Restoration Classes│
                     └─────────────────────┬────────────────────┘
                                           │
  [ Patient Clinical Profile ]             │ Detected Pathologies
  - Missing teeth & position               │ & Anatomical Landmarks
  - Medical history & risk factors         │
  - Patient budget & preferences           ▼
                     ┌──────────────────────────────────────────┐
                     │    Hybrid Clinical Recommendation Engine │
                     │  - Heuristic clinical scoring & rules    │
                     │  - Multi-factor candidate ranking        │
                     │  - Risk assessment & contraindications   │
                     └─────────────────────┬────────────────────┘
                                           │
                     ┌─────────────────────┴────────────────────┐
                     ▼                                          ▼
     [ Ranked Treatment Options ]                 [ Clinical Handover PDF ]
     - Top 5 candidates with rationales           - Complete diagnostic report
     - Estimated cost brackets                    - Radiograph with bounding boxes
     - Prognosis & success rates                  - Patient-dentist signoff
```

### 1. Computer Vision Detection (YOLOv8-Nano)
- **Model:** Fine-tuned YOLOv8-Nano detector (~3.01M parameters, `640 × 640` input resolution).
- **Training Dataset:** 16,995 panoramic dental radiographs from Roboflow Universe (`CC BY 4.0`), partitioned into 13,994 training, 1,500 validation, and 1,501 held-out test images.
- **10 Target Classes:**
  1. Caries (Tooth decay)
  2. Missing teeth
  3. Periapical lesion
  4. Impacted tooth
  5. Bone Loss
  6. Root Canal Treatment (RCT)
  7. Filling / Restoration
  8. Crown
  9. Implant
  10. Root Piece

### 2. Detection Performance

| Evaluation Split | Precision | Recall | mAP@0.5 | mAP@0.5:0.95 | Provenance |
|---|---|---|---|---|---|
| **Validation Split** (Published Manuscript) | 0.460 | 0.480 | 0.430 | 0.220 | EICON 2026 Proceedings, Table 1 |
| **Held-Out Test Split** (Shipped Checkpoint) | **0.629** | **0.584** | **0.581** | **0.298** | Ultralytics validation run on unseen test set |

### 3. Recommendation & Decision Support Engine
- Multi-criteria heuristic scoring engine evaluates clinical urgency, tooth position (anterior vs. posterior aesthetic/functional load), bone density, patient age, systemic health factors (diabetes, osteoporosis), and patient budget.
- Evaluates candidate prosthetic solutions across **9 clinical modalities** (including Single Crown, Fixed Dental Prosthesis / Bridge, Removable Partial Denture, Complete Denture, Implant-Supported Crown, and Hybrid Denture).
- Generates the **Top 5 ranked treatment plans**, accompanied by clinical rationales, estimated costs, and clinical success estimates.

### 4. Clinical Handover Report
- Generates an instant, downloadable diagnostic report (PDF) with the annotated panoramic radiograph, detected tooth pathologies, ranked prosthetics, and space for clinician review and consent.

---

## 💻 Tech Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Radix UI / Lucide React.
- **AI Backend:** FastAPI, PyTorch, Ultralytics YOLOv8, OpenCV, Pillow, NumPy.
- **Reporting Service:** ReportLab Python engine (`pdf_api`) for vector PDF generation.
- **Deployment:** Docker, Hugging Face Spaces (GPU/CPU Container), Vercel.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or later
- Python 3.11, 3.12, or 3.13
- Git

### 1. Clone Repository
```bash
git clone https://github.com/akila-ncmd/AI-Powered-Dental-Prosthetic-and-Recommendation-System.git
cd AI-Powered-Dental-Prosthetic-and-Recommendation-System
```

### 2. Backend Setup (FastAPI & YOLOv8)
```bash
cd DentalAI-Backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. PDF Generator API Setup
```bash
cd ../pdf_api
pip install -r requirements.txt
python app.py
```

### 4. Frontend Setup (Next.js)
```bash
cd ..
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

*(On Windows, you can also run `start-all.bat` to launch all services together.)*

---

## 📖 Citation

If you use this codebase, model architecture, or findings in your research, please cite our paper:

### BibTeX
```bibtex
@inproceedings{nilupul2026dentalai,
  title={AI-Powered Dental Prosthetic and Recommendation System},
  author={Nilupul, H. M. and Fonseka, N. and Akalanka, A. U.},
  booktitle={Proceedings of the ESOFT International Conference (EICON) 2026},
  volume={1},
  pages={36--43},
  year={2026},
  month={August},
  address={Kandy, Sri Lanka},
  publisher={ESOFT University},
  issn={3121-5122},
  isbn={978-624-6610-01-2},
  doi={10.5281/zenodo.23612738},
  url={https://doi.org/10.5281/zenodo.23612738}
}
```

### Vancouver / APA Style
> Nilupul, H. M., Fonseka, N., & Akalanka, A. U. (2026). AI-Powered Dental Prosthetic and Recommendation System. In *Proceedings of the ESOFT International Conference (EICON) 2026* (Vol. 1, pp. 36–43). ESU, Kandy, Sri Lanka. DOI: [10.5281/zenodo.23612738](https://doi.org/10.5281/zenodo.23612738).

---

## 📄 License & Attribution

- **Research Publication & Documentation:** Open Access licensed under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/).
- **Code:** Licensed under the MIT License.
- **Dataset:** Roboflow Universe Dental Panoramic Radiographs v3 (CC BY 4.0).
