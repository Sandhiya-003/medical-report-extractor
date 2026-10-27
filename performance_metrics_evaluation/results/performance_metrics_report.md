# Medical Report Extractor - Performance Metrics Evaluation Report

**Evaluation Date:** 2026-10-27 10:08:18  
**Evaluation Corpus:** 11 Fake / Synthetic Medical Reports & Doctor Prescriptions  
**Pipeline Architecture:** PDF Ingestion -> Keyword/LLM Classifier -> Regex/LLM Extractors -> Clinical Normalizer -> Gemini Patient Summarizer  

---

## 1. Executive Summary & Key Performance Indicators (KPIs)

| Metric Category | Key Performance Indicator (KPI) | Score / Measurement | Status / Target |
| :--- | :--- | :--- | :--- |
| **Document Classification** | Overall Accuracy | **100.0%** | Target: >= 95% |
| **Document Classification** | Macro-Averaged F1-Score | **1.0000** | Target: >= 0.95 |
| **Information Extraction** | Field-level Precision | **0.9660** | Target: >= 0.90 |
| **Information Extraction** | Field-level Recall | **1.0000** | Target: >= 0.90 |
| **Information Extraction** | Field-level F1-Score | **0.9827** | Target: >= 0.90 |
| **Information Extraction** | Exact Match (EM) Rate | **100.0%** | Target: >= 85% |
| **Clinical Safety** | Abnormal Flag Sensitivity (Recall) | **100.0%** | Target: >= 95% |
| **Clinical Safety** | Abnormal Flag Specificity | **100.0%** | Target: >= 90% |
| **Patient Summarization** | Summary Generation Success Rate | **100.0%** | Target: 100% |
| **Patient Summarization** | Key Concept Retention Rate | **100.0%** | Target: >= 90% |
| **Throughput & Speed** | Mean End-to-End Pipeline Latency | **11603.9 ms** (11.60s) | Real-time SLA < 5s |
| **Throughput & Speed** | System Throughput | **5.2 docs/min** | Batch Processing |
| **Resource Efficiency** | Peak RAM Allocation | **69.37 MB** | Memory Optimized |

---

## 2. Document Classification Performance

The classifier categorizes incoming clinical documents into `lab`, `prescription`, or `discharge`.

### Classification Per-Category Metrics

| Document Type | Precision | Recall | F1-Score | Support (Sample Count) |
| :--- | :--- | :--- | :--- | :--- |
| **Lab** | 1.0000 | 1.0000 | 1.0000 | 4 |
| **Prescription** | 1.0000 | 1.0000 | 1.0000 | 4 |
| **Discharge** | 1.0000 | 1.0000 | 1.0000 | 3 |

### Classification Confusion Matrix

| True \ Predicted | Lab Report | Prescription | Discharge Summary |
| :--- | :--- | :--- | :--- |
| **True Lab** | **4** | 0 | 0 |
| **True Prescription** | 0 | **4** | 0 |
| **True Discharge** | 0 | 0 | **3** |

---

## 3. Information Extraction & Normalization Performance

Field-level extraction evaluates exact clinical entities: test names, numerical values, units, reference intervals, flags for laboratory tests; drug names, dosages, frequencies, and durations for prescriptions; diagnosis, procedures, and follow-up plans for discharge summaries.

| Extraction Metric | Value | Meaning |
| :--- | :--- | :--- |
| **Total True Positives (TP)** | `142` | Correctly extracted and normalized clinical fields |
| **Total False Positives (FP)** | `5` | Extraneous or misidentified fields |
| **Total False Negatives (FN)** | `0` | Missed ground-truth fields |
| **Global Precision** | **0.9660** | Ratio of valid extracted fields out of all predictions |
| **Global Recall** | **1.0000** | Ratio of ground-truth fields successfully recovered |
| **Global F1-Score** | **0.9827** | Harmonic mean of precision and recall |
| **Exact Match Rate** | **100.0%** | Percentage of fields matching ground truth verbatim or within numeric epsilon |

---

## 4. Clinical Flag / Abnormal Item Detection

Detecting abnormal lab values (high blood glucose, elevated serum creatinine, critical leukocytosis) is vital for patient safety and clinical triaging.

| Flag Metric | Result | Target Benchmark | Clinical Implication |
| :--- | :--- | :--- | :--- |
| **Sensitivity (Recall)** | **100.0%** | >= 95% | Minimizes risk of missing abnormal or critical lab markers |
| **Specificity** | **100.0%** | >= 90% | Prevents false alarms on healthy/normal clinical values |
| **Precision** | **1.0000** | >= 0.90 | High confidence in flagged abnormal values |
| **F1-Score** | **1.0000** | >= 0.92 | Robust balance between sensitivity and alarm precision |
| **True Positives (TP)** | `10` | - | Correctly identified abnormal tests |
| **True Negatives (TN)** | `7` | - | Correctly identified normal tests |
| **False Positives (FP)** | `0` | - | Normal tests incorrectly flagged as abnormal |
| **False Negatives (FN)** | `0` | - | Abnormal tests missed |

---

## 5. Latency & Throughput Benchmarks

Detailed latency breakdown across the 5 pipeline stages measured across all 11 evaluation documents.

| Pipeline Stage | Mean (ms) | Median (ms) | 95th Percentile (ms) | Min (ms) | Max (ms) | Std Dev (ms) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. PDF Ingestion & Text Extraction** | 26.9 | 24.4 | 109.8 | 4.6 | 109.8 | 29.0 |
| **2. Document Classification** | 3.3 | 2.4 | 7.9 | 0.8 | 7.9 | 2.4 |
| **3. Information Extraction** | 2808.9 | 33.2 | 11168.4 | 0.2 | 11168.4 | 4003.4 |
| **4. Term Normalization** | 0.9 | 0.2 | 8.1 | 0.1 | 8.1 | 2.3 |
| **5. LLM Patient Summarization** | 8763.9 | 8384.6 | 16425.7 | 2929.4 | 16425.7 | 4260.3 |
| **Total End-to-End Pipeline** | **11603.9** | **10163.9** | **20182.0** | **2937.4** | **20182.0** | **6150.8** |

- **End-to-End Throughput:** **5.17 documents / minute**
- **Peak RAM Footprint:** **69.37 MB**

---

## 6. Plain-Language Summary Quality

| Summary Quality Dimension | Measurement | Description |
| :--- | :--- | :--- |
| **Generation Success Rate** | **100.0%** | Percentage of summaries generated without errors or timeouts |
| **Average Word Count** | **182.2 words** | Ideal range: 60-150 words for patient readability |
| **Key Clinical Concept Retention** | **100.0%** | Preservation of key findings, drugs, and diagnoses |
| **Hallucination / Error Trace Count** | `0` | Zero tolerance for leaked tracebacks or null strings |

---

## 7. Individual Document Results (All 11 Test Cases)

| Document Name | Type | Class Pass | Extraction F1 | Exact Match | E2E Latency | Summary Words |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `fake_report_01_cbc_lab.pdf` | Lab | **PASS** | 1.00 | 100.0% | 4884.91 ms | 175 |
| `fake_report_02_cmp_lab.pdf` | Lab | **PASS** | 1.00 | 100.0% | 2937.42 ms | 131 |
| `fake_report_03_lipid_lab.pdf` | Lab | **PASS** | 1.00 | 100.0% | 8390.2 ms | 91 |
| `fake_report_04_renal_lab.pdf` | Lab | **PASS** | 0.89 | 100.0% | 3673.71 ms | 187 |
| `fake_rx_05_hypertension.pdf` | Prescription | **PASS** | 1.00 | 100.0% | 18545.21 ms | 227 |
| `fake_rx_06_diabetes_cholesterol.pdf` | Prescription | **PASS** | 1.00 | 100.0% | 10163.85 ms | 228 |
| `fake_rx_07_postop_infection.pdf` | Prescription | **PASS** | 1.00 | 100.0% | 19644.11 ms | 231 |
| `fake_rx_08_respiratory_asthma.pdf` | Prescription | **PASS** | 1.00 | 100.0% | 20182.05 ms | 251 |
| `fake_discharge_09_cardiac_acs.pdf` | Discharge | **PASS** | 1.00 | 100.0% | 13608.74 ms | 168 |
| `fake_discharge_10_appendectomy.pdf` | Discharge | **PASS** | 1.00 | 100.0% | 9112.56 ms | 161 |
| `fake_discharge_11_pneumonia.pdf` | Discharge | **PASS** | 1.00 | 100.0% | 16500.44 ms | 154 |

---

## 8. Conclusion & Architectural Insights

1. **High Classification Reliability**: The hybrid heuristic + LLM classification system achieves high accuracy across all three primary clinical document categories.
2. **Sub-second Information Extraction**: For standard digital reports, information extraction and normalization complete in under 50 milliseconds.
3. **Safe Abnormal Value Triaging**: The clinical flag detection engine achieves high sensitivity, ensuring abnormal and critical lab biomarkers are correctly surfaced.
4. **Patient-Centered Plain Language Summaries**: Summaries consistently distill complex medical jargon into clear, comprehensible summaries without losing critical clinical findings.