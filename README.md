# Medical Report Information Extraction & Summarization System

A pipeline that turns unstructured medical reports (PDFs or scanned images) into
structured, normalized data and a plain-language patient summary — with a
Streamlit UI to demo it end-to-end.

## Problem statement

Medical reports (lab results, prescriptions, discharge summaries) are unstructured
text — often scanned images, not searchable PDFs — full of abbreviations, inconsistent
units, and clinical shorthand that's hard for a non-specialist to interpret quickly.
This project builds a pipeline that:

1. Reads a report regardless of whether it's a digital PDF or a scan (OCR).
2. Classifies which of three report types it is.
3. Extracts the clinically relevant fields (test results, medications, diagnoses).
4. Normalizes those fields into a consistent schema (same test/drug name and unit
   notation regardless of how the source document phrased it).
5. Generates a plain-English summary of what the report means, including what's
   abnormal or worth attention.

## Architecture

```mermaid
flowchart LR
    A[PDF / Image Upload] --> B[Stage 2: Ingestion]
    B -->|digital PDF| B1[PyMuPDF text extraction]
    B -->|scanned PDF/image| B2[OpenCV preprocessing --> Tesseract OCR]
    B1 --> C[Stage 3: Classification]
    B2 --> C
    C -->|keyword heuristic| D{doc_type}
    D -->|lab| E1[Lab Extractor - regex]
    D -->|prescription| E2[Prescription Extractor - regex + scispaCy NER]
    D -->|discharge| E3[Discharge Extractor - section splitter + NER]
    E1 --> F[Stage 4: Normalization]
    E2 --> F
    E3 --> F
    F -->|units, drug names, test names, diagnoses| G[Normalized Schema<br/>LabResult / PrescriptionItem / DischargeInfo]
    G --> H[Stage 5: Summarization<br/>Google Gemini LLM - gemini-3.5-flash-lite]
    G --> I[Streamlit UI / React MedLens UI]
    H --> I
    I --> J[Raw Text / Extracted Fields /<br/>Plain-Language Summary / Flagged Items]
```

**Pipeline stages, mapped to code:**

| Stage | Folder | What it does |
|---|---|---|
| 2. Ingestion | `ingestion/` | PDF text extraction (PyMuPDF), OCR (Tesseract + Gemini Vision OCR), image preprocessing (OpenCV) |
| 3. Classification + Extraction | `classification/`, `extraction/` | Doc-type detection, regex + scispaCy NER + LLM field extraction |
| 4. Normalization | `normalization/` | Unit/drug/test-name canonicalization, dataclass schemas |
| 5. Summarization + UI | `summarization/`, `app/`, `api/`, `frontend/` | LLM-generated plain-language summary, FastAPI backend, React dashboard, Streamlit app |
| 6. Performance Evaluation | `eval/`, `performance_metrics_evaluation/` | Ground-truth annotation, field-level precision/recall/F1, automated 11-report benchmarking suite |

## Tech stack

- **PDF parsing:** PyMuPDF (`fitz`)
- **OCR:** Tesseract via `pytesseract` & Google Gemini Vision Multimodal OCR (for handwritten doctor prescriptions)
- **Image preprocessing:** OpenCV (`opencv-python`) & Pillow
- **NER:** scispaCy (`en_core_sci_sm` biomedical model)
- **LLM summarization & vision:** Google Gemini API (`gemini-3.5-flash-lite`, `gemini-3.5-flash`, `google-genai`)
- **Backend API:** FastAPI & SQLite (`api/`)
- **Frontend Dashboard:** Modern React 19 + Tailwind CSS + Lucide Icons + Vite (`frontend/`)
- **Classic UI:** Streamlit (`app/`)
- **Evaluation & Benchmarks:** Automated 11-report performance evaluation suite (`performance_metrics_evaluation/`)
- **Date parsing:** `python-dateutil`
- **Language:** Python 3.11 / 3.12

## Setup

### 1. Clone and create a virtual environment

```bash
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Install Tesseract OCR

This project calls the Tesseract *binary* via `pytesseract`, not a Python-only
package — it must be installed separately:

- **Windows:** download from the [UB-Mannheim Tesseract installer](https://github.com/UB-Mannheim/tesseract/wiki)
- **macOS:** `brew install tesseract`
- **Linux:** `sudo apt install tesseract-ocr`

If it's not on your system `PATH`, point `pytesseract` at the binary in
`ingestion/ocr.py`:

```python
pytesseract.pytesseract.tesseract_cmd = r"C:\path\to\tesseract.exe"
```

### 4. Set up your `.env` file

Create a `.env` file in the project root with your [Google Gemini API key](https://aistudio.google.com/):

```
GEMINI_API_KEY=your_gemini_key_here
```

### 5. Verify everything's working

```bash
python test_setup.py
```

This checks all imports, the Tesseract binary, the Gemini API key, and the scispaCy
model, and reports `[OK]`/`[FAIL]` for each.

## Running the application

### Option 1: MedLens AI Modern Web App (Recommended)

1. **Start the FastAPI backend server** (port 8000):
   ```bash
   python -m uvicorn api.server:app --port 8000 --reload
   ```

2. **Start the React + Vite frontend** (port 5173):
   ```bash
   cd frontend
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

### Option 2: Classic Streamlit App

```bash
streamlit run app/streamlit_app.py
```

Open `http://localhost:8501` to view the original Streamlit interface.

You can also run each pipeline stage's own test script independently:

```bash
python ingestion/test_ingestion.py
python extraction/test_extraction.py
python normalization/test_normalization.py
```

## Sample output

> _Add 1-2 screenshots here of the Streamlit app in action (e.g. the Extracted
> Fields table and the Plain-Language Summary tab) before sharing this project._

## Automated Performance Metrics Evaluation (11 Test Cases)

An automated performance metrics evaluation test suite is located in the [`performance_metrics_evaluation/`](performance_metrics_evaluation/) directory. It tests the end-to-end pipeline across **11 synthetic medical reports and doctor prescriptions** with verified ground truth annotations.

### Evaluated Test Cases
- **4 Laboratory Reports:** Complete Blood Count (CBC) with differential, Comprehensive Metabolic Panel (CMP), Lipid Profile & Blood Markers, Renal Function & Electrolyte Panel.
- **4 Doctor Prescriptions:** Hypertension (Amlodipine, Losartan, Atorvastatin), Type 2 Diabetes (Metformin, Pantoprazole, Rosuvastatin), Post-Surgical (Amoxicillin, Acetaminophen, Ibuprofen), Respiratory/Asthma (Azithromycin, Montelukast, Cetirizine).
- **3 Hospital Discharge Summaries:** Acute Coronary Syndrome (NSTEMI / Stent placement), Laparoscopic Appendectomy (Acute appendicitis / peritonitis), Community-Acquired Bacterial Pneumonia.

### Running the Performance Test Suite

```bash
python performance_metrics_evaluation\run_performance_tests.py
```

To regenerate the 11 synthetic clinical test PDFs and ground-truth JSON files:

```bash
python performance_metrics_evaluation\generators\generate_fake_reports.py
```

### Benchmark Results Summary

| Metric Dimension | Key Performance Indicator (KPI) | Measured Score | Status / Target |
| :--- | :--- | :---: | :---: |
| **Classification** | Overall Accuracy | **100.0%** (11/11) | ✅ Passed (Target: >= 95%) |
| **Classification** | Macro-Averaged F1-Score | **1.0000** | ✅ Passed |
| **Extraction** | Field-Level Precision | **0.9660** (142 TP / 5 FP) | ✅ Passed (Target: >= 0.90) |
| **Extraction** | Field-Level Recall | **1.0000** (0 FN) | ✅ Zero Missed Fields |
| **Extraction** | Field-Level F1-Score | **0.9827** | ✅ Production Quality |
| **Extraction** | Exact Field Match Rate | **100.0%** | ✅ Exact Verification |
| **Clinical Safety** | Abnormal Flag Sensitivity (Recall) | **100.0%** (10/10) | ✅ Zero Missed Critical Alerts |
| **Clinical Safety** | Abnormal Flag Specificity | **100.0%** (7/7) | ✅ Zero False Alarms |
| **Summarization** | Plain-Language Success Rate | **100.0%** | ✅ Error-Free |
| **Summarization** | Clinical Concept Retention Rate | **100.0%** | ✅ Zero Concept Loss |
| **Speed & Latency** | Mean Pipeline Latency | **11.6 seconds** | Real-time SLA |
| **System Footprint** | Peak Memory RAM | **69.37 MB** | Resource-Efficient |

Detailed outputs are generated in `performance_metrics_evaluation/results/`:
- [`performance_metrics_report.md`](performance_metrics_evaluation/results/performance_metrics_report.md) — Comprehensive Markdown evaluation report
- [`performance_metrics_report.json`](performance_metrics_evaluation/results/performance_metrics_report.json) — Full machine-readable test telemetry
- [`summary_table.csv`](performance_metrics_evaluation/results/summary_table.csv) — Per-document performance table
- [`confusion_matrix.json`](performance_metrics_evaluation/results/confusion_matrix.json) — Document classification confusion matrix

---

## Evaluation methodology (Sample-by-sample Ground Truth)

Evaluation compares the pipeline's extracted+normalized output against
hand-verified ground truth, scored as field-level precision/recall/F1.

1. **Generate draft ground truth** — run the pipeline on every sample and save its
   output as a starting point:

   ```bash
   python eval/annotate.py
   ```

   This writes one JSON file per sample into `eval/ground_truth/`, each marked
   `"verified": false`.

2. **Review and correct** — open each JSON file, compare it against the source
   report, fix any wrong values, and set `"verified": true`. Only verified files
   are scored — this keeps the pipeline from ever being graded against its own
   unreviewed output.

3. **Run the metrics**:

   ```bash
   python eval/metrics.py
   ```

   This reports per-sample and overall precision/recall/F1. Scoring treats each
   record (a lab result, a prescription item) as a set of `(field, value)` pairs,
   matched by canonical name (test name / drug name) — a completely missed or
   spurious record counts as a miss on every one of its fields, not just a single
   error.

Two sample ground truth files are pre-verified as a working example: a
perfect-match lab report (precision/recall/F1 = 1.0) and a prescription with one
intentionally-injected discrepancy, so `eval/metrics.py` demonstrably catches a
real mismatch rather than trivially always scoring 1.0.

## Ethics note

**All sample data in `data/samples/` is synthetic.** It was generated
programmatically for this project (fabricated names, values, and dates) and does
not contain, and was never derived from, any real patient's information. No real
protected health information (PHI) was used anywhere in building or testing this
project. If you point this pipeline at real medical records, handle them under
your organization's applicable privacy/compliance requirements (e.g. HIPAA) —
this project does not implement PHI-grade storage, access control, or audit
logging, and isn't intended for use with real patient data as-is.

## Future improvements

- Replace the hardcoded drug/lab-test lookup dictionaries in
  `normalization/term_mapper.py` with real terminology API lookups (RxNorm for
  drugs, LOINC for lab tests).
- Replace the keyword-heuristic document classifier
  (`classification/doc_type_classifier.py`) with a trained text classifier once
  enough labeled reports are available.
- Add deskewing to `ingestion/preprocess.py` for photographed (not flatbed-scanned)
  reports.
- Support multi-page reports with mixed content (e.g. a discharge summary with an
  embedded lab table).
- Expand `eval/` with a larger, more diverse ground-truth set and add per-field
  (not just per-record) error breakdowns to `eval/metrics.py`.
- Add authentication and encrypted storage if this were ever extended to handle
  real patient data.
