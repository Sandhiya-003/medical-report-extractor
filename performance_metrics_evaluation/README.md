# Performance Metrics Evaluation Test Suite

This folder contains the complete automated performance metrics evaluation test suite for the **Medical Report Extractor** pipeline.

It tests the complete end-to-end pipeline against **11 synthetic / fake medical reports and doctor prescriptions** with hand-verified ground truth annotations.

---

## 📁 Directory Structure

```
performance_metrics_evaluation/
├── test_data/                                 # 11 fake medical test cases
│   ├── fake_report_01_cbc_lab.pdf             # Complete Blood Count (CBC)
│   ├── report_01_cbc_lab_ground_truth.json
│   ├── fake_report_02_cmp_lab.pdf             # Comprehensive Metabolic Panel
│   ├── report_02_cmp_lab_ground_truth.json
│   ├── fake_report_03_lipid_lab.pdf           # Lipid Profile
│   ├── report_03_lipid_lab_ground_truth.json
│   ├── fake_report_04_renal_lab.pdf           # Renal Function & Electrolytes
│   ├── report_04_renal_lab_ground_truth.json
│   ├── fake_rx_05_hypertension.pdf            # Prescription: Hypertension
│   ├── report_05_hypertension_rx_ground_truth.json
│   ├── fake_rx_06_diabetes_cholesterol.pdf    # Prescription: Type 2 Diabetes
│   ├── report_06_diabetes_rx_ground_truth.json
│   ├── fake_rx_07_postop_infection.pdf        # Prescription: Post-Op Surgery
│   ├── report_07_postop_rx_ground_truth.json
│   ├── fake_rx_08_respiratory_asthma.pdf      # Prescription: Asthma/Bronchitis
│   ├── report_08_respiratory_rx_ground_truth.json
│   ├── fake_discharge_09_cardiac_acs.pdf      # Discharge: Acute Coronary Syndrome
│   ├── report_09_cardiac_discharge_ground_truth.json
│   ├── fake_discharge_10_appendectomy.pdf     # Discharge: Laparoscopic Appendectomy
│   ├── report_10_appendectomy_discharge_ground_truth.json
│   ├── fake_discharge_11_pneumonia.pdf        # Discharge: Bacterial Pneumonia
│   ├── report_11_pneumonia_discharge_ground_truth.json
│   └── manifest.json                          # Test suite manifest
├── generators/
│   └── generate_fake_reports.py               # Generates the 11 PDF reports & ground truth files
├── evaluator/
│   └── metrics_engine.py                      # Computes classification, extraction, latency & summary metrics
├── results/                                   # Evaluation output reports
│   ├── performance_metrics_report.json        # Full structured test telemetry & benchmarks
│   ├── performance_metrics_report.md          # Comprehensive executive Markdown report
│   ├── confusion_matrix.json                  # Document classification confusion matrix
│   └── summary_table.csv                      # Per-document metric results in CSV format
├── run_performance_tests.py                   # Main test execution script
└── README.md                                  # Documentation
```

---

## 🧪 Evaluated Performance Metrics

1. **Document Classification Performance**:
   - Accuracy
   - Macro/Micro Precision, Recall, and F1-Score
   - 3x3 Confusion Matrix (`lab`, `prescription`, `discharge`)

2. **Information Extraction & Normalization Performance**:
   - Field-level Precision, Recall, and F1-Score
   - Exact Match (EM) Rate
   - True Positives (TP), False Positives (FP), and False Negatives (FN)

3. **Clinical Safety & Flagged Item Detection**:
   - Abnormal value sensitivity (Recall of abnormal/critical biomarkers)
   - Specificity (Correct classification of normal values)
   - Precision & F1-Score of abnormal alerts

4. **Latency & Throughput Benchmarks**:
   - Stage-by-stage timing: Ingestion, Classification, Extraction, Normalization, Summarization
   - Mean, Median, Min, Max, 95th Percentile (p95), and Standard Deviation
   - End-to-end processing throughput (Documents / Minute)

5. **Plain-Language Summary Quality**:
   - Generation success rate
   - Word count & length distribution
   - Retention rate of critical clinical concepts (diagnoses, medications, abnormal flags)
   - Zero-tolerance error marker / hallucination checks

6. **System Resource Overhead**:
   - Peak RAM footprint (MB)
   - Total test suite execution time

---

## 🚀 How to Run the Tests

From the project root:

```powershell
python performance_metrics_evaluation\run_performance_tests.py
```

To regenerate the 11 fake medical test cases and ground truth annotations:

```powershell
python performance_metrics_evaluation\generators\generate_fake_reports.py
```
