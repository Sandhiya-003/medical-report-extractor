"""
Generator for 11 synthetic medical reports and prescriptions with verified ground truth annotations.

Generates:
1. Four Laboratory Reports (CBC, CMP, Lipid Profile, Renal/Electrolytes)
2. Four Doctor Prescriptions (Hypertension/Cardio, Diabetes/Cholesterol, Post-Op Surgical/Pain, Respiratory/Asthma)
3. Three Hospital Discharge Summaries (Acute Coronary Syndrome, Laparoscopic Appendectomy, Community-Acquired Pneumonia)

Outputs:
- PDF files in `test_data/`
- Ground Truth JSON annotations in `test_data/`
"""

import json
import os
import fitz  # PyMuPDF


def create_pdf_from_text(output_path: str, title: str, lines: list):
    """Creates a clean, professional medical PDF using PyMuPDF."""
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)  # Standard Letter size

    # Header banner styling
    rect_header = fitz.Rect(36, 36, 576, 80)
    page.draw_rect(rect_header, color=(0.05, 0.45, 0.45), fill=(0.92, 0.98, 0.98), width=1.5)
    page.insert_text((48, 62), title, fontsize=14, fontname="helv", color=(0.05, 0.35, 0.35))

    # Body lines
    y = 105
    for line in lines:
        if y > 740:
            page = doc.new_page(width=612, height=792)
            y = 50

        if line.startswith("===") or line.startswith("---"):
            page.draw_line(fitz.Point(36, y), fitz.Point(576, y), color=(0.7, 0.7, 0.7), width=1)
            y += 14
        elif line.startswith("# "):
            page.insert_text((36, y + 2), line[2:], fontsize=12, fontname="helv", color=(0.05, 0.3, 0.3))
            y += 20
        elif line.startswith("## "):
            page.insert_text((36, y + 2), line[3:], fontsize=11, fontname="helv", color=(0.15, 0.2, 0.25))
            y += 18
        elif line.startswith("   "):
            page.insert_text((48, y), line.strip(), fontsize=10, fontname="courier", color=(0.1, 0.1, 0.1))
            y += 15
        elif ":" in line and not line.startswith("http"):
            parts = line.split(":", 1)
            page.insert_text((36, y), parts[0] + ":", fontsize=10, fontname="helv", color=(0.2, 0.2, 0.2))
            page.insert_text((180, y), parts[1].strip(), fontsize=10, fontname="helv", color=(0.05, 0.05, 0.05))
            y += 15
        else:
            page.insert_text((36, y), line, fontsize=10, fontname="helv", color=(0.15, 0.15, 0.15))
            y += 15

    # Footer
    page.draw_line(fitz.Point(36, 755), fitz.Point(576, 755), color=(0.8, 0.8, 0.8), width=0.5)
    page.insert_text((36, 768), "SYNTHETIC MEDICAL TEST DATA - CONFIDENTIAL CLINICAL EVALUATION", fontsize=8, fontname="helv", color=(0.5, 0.5, 0.5))

    doc.save(output_path)
    doc.close()


def generate_all_samples(base_dir: str):
    """Generates the 11 fake medical test reports and ground truth annotations."""
    test_data_dir = os.path.join(base_dir, "test_data")
    os.makedirs(test_data_dir, exist_ok=True)

    samples = [
        # -------------------------------------------------------------
        # 1. Complete Blood Count (CBC) Lab Report
        # -------------------------------------------------------------
        {
            "id": "report_01_cbc_lab",
            "filename": "fake_report_01_cbc_lab.pdf",
            "doc_type": "lab",
            "title": "METRO HEALTH PATHOLOGY LABS - Complete Blood Count (CBC)",
            "lines": [
                "Patient Name: John Doe",
                "Patient ID: PT-10029",
                "Age / Gender: 45 Y / Male",
                "Referring Doctor: Dr. Evelyn Reed, MD",
                "Collection Date: 2026-10-15",
                "Specimen: Whole Blood (EDTA)",
                "----------------------------------------------------------------------",
                "# TEST NAME                               RESULT    UNIT     REFERENCE RANGE     FLAG",
                "----------------------------------------------------------------------",
                "Hemoglobin: 11.2 g/dL (13.5-17.5 g/dL, Low)",
                "White Blood Cell Count: 12.8 /uL (4.5-11.0 /uL, High)",
                "Platelet Count: 245 /uL (150-450 /uL, Normal)",
                "Red Blood Cell Count: 4.10 /uL (4.30-5.90 /uL, Low)",
                "Glucose: 98 mg/dL (70-99 mg/dL, Normal)",
                "----------------------------------------------------------------------",
                "Impression: Mild normocytic anemia with mild leukocytosis.",
                "Clinical Notes: Recommend evaluation of iron studies and follow-up.",
            ],
            "ground_truth": {
                "id": "report_01_cbc_lab",
                "doc_type": "lab",
                "verified": True,
                "fields": [
                    {"test_name": "Hemoglobin", "canonical_test_name": "Hemoglobin", "value": 11.2, "unit": "g/dL", "reference_range": "13.5-17.5 g/dL", "flag": "Low"},
                    {"test_name": "White Blood Cell Count", "canonical_test_name": "White Blood Cell Count", "value": 12.8, "unit": "/uL", "reference_range": "4.5-11.0 /uL", "flag": "High"},
                    {"test_name": "Platelet Count", "canonical_test_name": "Platelet Count", "value": 245.0, "unit": "/uL", "reference_range": "150-450 /uL", "flag": "Normal"},
                    {"test_name": "Red Blood Cell Count", "canonical_test_name": "Red Blood Cell Count", "value": 4.10, "unit": "/uL", "reference_range": "4.30-5.90 /uL", "flag": "Low"},
                    {"test_name": "Glucose", "canonical_test_name": "Glucose", "value": 98.0, "unit": "mg/dL", "reference_range": "70-99 mg/dL", "flag": "Normal"},
                ],
                "expected_flagged": ["Hemoglobin", "White Blood Cell Count", "Red Blood Cell Count"],
            }
        },

        # -------------------------------------------------------------
        # 2. Comprehensive Metabolic Panel (CMP)
        # -------------------------------------------------------------
        {
            "id": "report_02_cmp_lab",
            "filename": "fake_report_02_cmp_lab.pdf",
            "doc_type": "lab",
            "title": "CENTRAL DIAGNOSTICS & CLINICAL LABORATORY - Metabolic Panel",
            "lines": [
                "Patient Name: Eleanor Vance",
                "Patient ID: PT-20451",
                "Age / Gender: 62 Y / Female",
                "Referring Doctor: Dr. Marcus Sterling, MD",
                "Collection Date: 2026-10-18",
                "Specimen: Serum (Fasting)",
                "----------------------------------------------------------------------",
                "# TEST NAME                               RESULT    UNIT     REFERENCE RANGE     FLAG",
                "----------------------------------------------------------------------",
                "Glucose: 168 mg/dL (70-99 mg/dL, High)",
                "Creatinine: 1.8 mg/dL (0.6-1.2 mg/dL, High)",
                "Sodium: 139 /uL (135-145 /uL, Normal)",
                "Potassium: 4.8 /uL (3.5-5.0 /uL, Normal)",
                "----------------------------------------------------------------------",
                "Impression: Hyperglycemia and elevated serum creatinine noted.",
                "Clinical Notes: Correlate with renal ultrasound and HbA1c testing.",
            ],
            "ground_truth": {
                "id": "report_02_cmp_lab",
                "doc_type": "lab",
                "verified": True,
                "fields": [
                    {"test_name": "Glucose", "canonical_test_name": "Glucose", "value": 168.0, "unit": "mg/dL", "reference_range": "70-99 mg/dL", "flag": "High"},
                    {"test_name": "Creatinine", "canonical_test_name": "Creatinine", "value": 1.8, "unit": "mg/dL", "reference_range": "0.6-1.2 mg/dL", "flag": "High"},
                    {"test_name": "Sodium", "canonical_test_name": "Sodium", "value": 139.0, "unit": "/uL", "reference_range": "135-145 /uL", "flag": "Normal"},
                    {"test_name": "Potassium", "canonical_test_name": "Potassium", "value": 4.8, "unit": "/uL", "reference_range": "3.5-5.0 /uL", "flag": "Normal"},
                ],
                "expected_flagged": ["Glucose", "Creatinine"],
            }
        },

        # -------------------------------------------------------------
        # 3. Lipid Profile Lab Report
        # -------------------------------------------------------------
        {
            "id": "report_03_lipid_lab",
            "filename": "fake_report_03_lipid_lab.pdf",
            "doc_type": "lab",
            "title": "CARDIOVASCULAR HEALTH LAB - Lipid Profile & Blood Markers",
            "lines": [
                "Patient Name: David Miller",
                "Patient ID: PT-33108",
                "Age / Gender: 54 Y / Male",
                "Referring Doctor: Dr. Anita Desai, MD",
                "Collection Date: 2026-10-19",
                "Specimen: Fasting Serum",
                "----------------------------------------------------------------------",
                "# TEST NAME                               RESULT    UNIT     REFERENCE RANGE     FLAG",
                "----------------------------------------------------------------------",
                "Hemoglobin: 14.8 g/dL (13.0-17.0 g/dL, Normal)",
                "Glucose: 110 mg/dL (70-99 mg/dL, High)",
                "Platelet Count: 280 /uL (150-450 /uL, Normal)",
                "White Blood Cell Count: 7.2 /uL (4.0-10.5 /uL, Normal)",
                "----------------------------------------------------------------------",
                "Impression: Mild impaired fasting glycaemia with normal hematology.",
                "Clinical Notes: Lifestyle modification and dietary counseling advised.",
            ],
            "ground_truth": {
                "id": "report_03_lipid_lab",
                "doc_type": "lab",
                "verified": True,
                "fields": [
                    {"test_name": "Hemoglobin", "canonical_test_name": "Hemoglobin", "value": 14.8, "unit": "g/dL", "reference_range": "13.0-17.0 g/dL", "flag": "Normal"},
                    {"test_name": "Glucose", "canonical_test_name": "Glucose", "value": 110.0, "unit": "mg/dL", "reference_range": "70-99 mg/dL", "flag": "High"},
                    {"test_name": "Platelet Count", "canonical_test_name": "Platelet Count", "value": 280.0, "unit": "/uL", "reference_range": "150-450 /uL", "flag": "Normal"},
                    {"test_name": "White Blood Cell Count", "canonical_test_name": "White Blood Cell Count", "value": 7.2, "unit": "/uL", "reference_range": "4.0-10.5 /uL", "flag": "Normal"},
                ],
                "expected_flagged": ["Glucose"],
            }
        },

        # -------------------------------------------------------------
        # 4. Renal Function & Electrolytes Lab Report
        # -------------------------------------------------------------
        {
            "id": "report_04_renal_lab",
            "filename": "fake_report_04_renal_lab.pdf",
            "doc_type": "lab",
            "title": "ST. JUDE MEDICAL CENTER - Renal Function & Electrolyte Panel",
            "lines": [
                "Patient Name: Maria Garcia",
                "Patient ID: PT-41905",
                "Age / Gender: 58 Y / Female",
                "Referring Doctor: Dr. Carlos Santana, MD",
                "Collection Date: 2026-10-21",
                "Specimen: Plasma (Heparin)",
                "----------------------------------------------------------------------",
                "# TEST NAME                               RESULT    UNIT     REFERENCE RANGE     FLAG",
                "----------------------------------------------------------------------",
                "Creatinine: 2.3 mg/dL (0.5-1.1 mg/dL, High)",
                "Sodium: 132 /uL (136-145 /uL, Low)",
                "Potassium: 5.6 /uL (3.5-5.1 /uL, High)",
                "Glucose: 104 mg/dL (70-100 mg/dL, High)",
                "----------------------------------------------------------------------",
                "Impression: Stage 3 renal insufficiency with hyperkalemia and mild hyponatremia.",
                "Clinical Notes: Immediate nephrology consult recommended.",
            ],
            "ground_truth": {
                "id": "report_04_renal_lab",
                "doc_type": "lab",
                "verified": True,
                "fields": [
                    {"test_name": "Creatinine", "canonical_test_name": "Creatinine", "value": 2.3, "unit": "mg/dL", "reference_range": "0.5-1.1 mg/dL", "flag": "High"},
                    {"test_name": "Sodium", "canonical_test_name": "Sodium", "value": 132.0, "unit": "/uL", "reference_range": "136-145 /uL", "flag": "Low"},
                    {"test_name": "Potassium", "canonical_test_name": "Potassium", "value": 5.6, "unit": "/uL", "reference_range": "3.5-5.1 /uL", "flag": "High"},
                    {"test_name": "Glucose", "canonical_test_name": "Glucose", "value": 104.0, "unit": "mg/dL", "reference_range": "70-100 mg/dL", "flag": "High"},
                ],
                "expected_flagged": ["Creatinine", "Sodium", "Potassium", "Glucose"],
            }
        },

        # -------------------------------------------------------------
        # 5. Doctor Prescription - Hypertension Management
        # -------------------------------------------------------------
        {
            "id": "report_05_hypertension_rx",
            "filename": "fake_rx_05_hypertension.pdf",
            "doc_type": "prescription",
            "title": "DR. ROBERT HASTINGS, MD - CARDIOLOGY CLINIC - PRESCRIPTION",
            "lines": [
                "Clinic: Bayview Cardiology Centre, Suite 402",
                "Doctor: Dr. Robert Hastings, MD, FACC",
                "Patient: Michael Chang",
                "Age: 52 Years | Sex: Male",
                "Date: 2026-10-15",
                "Rx Number: RX-78219",
                "----------------------------------------------------------------------",
                "# Rx (PRESCRIPTION MEDICATIONS):",
                "----------------------------------------------------------------------",
                "1. Amlodipine 5mg once daily for 30 days",
                "2. Losartan 50mg once daily for 30 days",
                "3. Atorvastatin 20mg once daily for 30 days",
                "----------------------------------------------------------------------",
                "Instructions: Take medications with water after breakfast.",
                "Refills: 2 refills authorized.",
                "Doctor Signature: Dr. R. Hastings, MD",
            ],
            "ground_truth": {
                "id": "report_05_hypertension_rx",
                "doc_type": "prescription",
                "verified": True,
                "fields": [
                    {"drug_name": "Amlodipine", "canonical_drug_name": "Amlodipine", "dosage": "5mg", "frequency": "once daily", "duration": "for 30 days"},
                    {"drug_name": "Losartan", "canonical_drug_name": "Losartan", "dosage": "50mg", "frequency": "once daily", "duration": "for 30 days"},
                    {"drug_name": "Atorvastatin", "canonical_drug_name": "Atorvastatin", "dosage": "20mg", "frequency": "once daily", "duration": "for 30 days"},
                ],
                "expected_drugs": ["Amlodipine", "Losartan", "Atorvastatin"],
            }
        },

        # -------------------------------------------------------------
        # 6. Doctor Prescription - Diabetes & Cholesterol Management
        # -------------------------------------------------------------
        {
            "id": "report_06_diabetes_rx",
            "filename": "fake_rx_06_diabetes_cholesterol.pdf",
            "doc_type": "prescription",
            "title": "APEX DIABETES & ENDOCRINOLOGY CARE - PRESCRIPTION",
            "lines": [
                "Clinic: Apex Endocrinology Institute",
                "Doctor: Dr. Priya Sharma, MD (Endocrinology)",
                "Patient: Sarah Jenkins",
                "Age: 49 Years | Sex: Female",
                "Date: 2026-10-18",
                "Rx Number: RX-89104",
                "----------------------------------------------------------------------",
                "# Rx (PRESCRIPTION MEDICATIONS):",
                "----------------------------------------------------------------------",
                "1. Metformin 500mg twice daily for 60 days",
                "2. Pantoprazole 40mg once daily for 30 days",
                "3. Rosuvastatin 10mg once daily for 60 days",
                "----------------------------------------------------------------------",
                "Instructions: Take Metformin with meals. Take Pantoprazole 30 mins before breakfast.",
                "Refills: 1 refill permitted after fasting blood sugar review.",
                "Doctor Signature: Dr. P. Sharma",
            ],
            "ground_truth": {
                "id": "report_06_diabetes_rx",
                "doc_type": "prescription",
                "verified": True,
                "fields": [
                    {"drug_name": "Metformin", "canonical_drug_name": "Metformin", "dosage": "500mg", "frequency": "twice daily", "duration": "for 60 days"},
                    {"drug_name": "Pantoprazole", "canonical_drug_name": "Pantoprazole", "dosage": "40mg", "frequency": "once daily", "duration": "for 30 days"},
                    {"drug_name": "Rosuvastatin", "canonical_drug_name": "Rosuvastatin", "dosage": "10mg", "frequency": "once daily", "duration": "for 60 days"},
                ],
                "expected_drugs": ["Metformin", "Pantoprazole", "Rosuvastatin"],
            }
        },

        # -------------------------------------------------------------
        # 7. Doctor Prescription - Post-Op Anti-Infective & Analgesia
        # -------------------------------------------------------------
        {
            "id": "report_07_postop_rx",
            "filename": "fake_rx_07_postop_infection.pdf",
            "doc_type": "prescription",
            "title": "WESTSIDE SURGICAL ASSOCIATES - DISCHARGE PRESCRIPTION",
            "lines": [
                "Clinic: Westside Outpatient Surgery Pavilion",
                "Doctor: Dr. Arthur Kingsley, MD, FACS",
                "Patient: Arthur Pendelton",
                "Age: 38 Years | Sex: Male",
                "Date: 2026-10-20",
                "Rx Number: RX-91280",
                "----------------------------------------------------------------------",
                "# Rx (PRESCRIPTION MEDICATIONS):",
                "----------------------------------------------------------------------",
                "1. Amoxicillin 500mg three times daily for 7 days",
                "2. Acetaminophen 650mg three times daily for 5 days",
                "3. Ibuprofen 400mg twice daily for 5 days",
                "----------------------------------------------------------------------",
                "Instructions: Complete full 7-day antibiotic course even if feeling better.",
                "Refills: No refills (PRN acute use only).",
                "Doctor Signature: Dr. A. Kingsley",
            ],
            "ground_truth": {
                "id": "report_07_postop_rx",
                "doc_type": "prescription",
                "verified": True,
                "fields": [
                    {"drug_name": "Amoxicillin", "canonical_drug_name": "Amoxicillin", "dosage": "500mg", "frequency": "three times daily", "duration": "for 7 days"},
                    {"drug_name": "Acetaminophen", "canonical_drug_name": "Acetaminophen", "dosage": "650mg", "frequency": "three times daily", "duration": "for 5 days"},
                    {"drug_name": "Ibuprofen", "canonical_drug_name": "Ibuprofen", "dosage": "400mg", "frequency": "twice daily", "duration": "for 5 days"},
                ],
                "expected_drugs": ["Amoxicillin", "Acetaminophen", "Ibuprofen"],
            }
        },

        # -------------------------------------------------------------
        # 8. Doctor Prescription - Respiratory & Asthma Exacerbation
        # -------------------------------------------------------------
        {
            "id": "report_08_respiratory_rx",
            "filename": "fake_rx_08_respiratory_asthma.pdf",
            "doc_type": "prescription",
            "title": "CEDAR PARK PULMONARY CLINIC - OUTPATIENT PRESCRIPTION",
            "lines": [
                "Clinic: Cedar Park Pulmonology & Allergy Associates",
                "Doctor: Dr. Elena Rostova, MD (Pulmonologist)",
                "Patient: Lucas Bennett",
                "Age: 29 Years | Sex: Male",
                "Date: 2026-10-22",
                "Rx Number: RX-95311",
                "----------------------------------------------------------------------",
                "# Rx (PRESCRIPTION MEDICATIONS):",
                "----------------------------------------------------------------------",
                "1. Azithromycin 500mg once daily for 5 days",
                "2. Montelukast 10mg once daily for 14 days",
                "3. Cetirizine 10mg once daily for 10 days",
                "----------------------------------------------------------------------",
                "Instructions: Take Montelukast at bedtime. Inhale steam twice daily.",
                "Refills: None.",
                "Doctor Signature: Dr. Elena Rostova",
            ],
            "ground_truth": {
                "id": "report_08_respiratory_rx",
                "doc_type": "prescription",
                "verified": True,
                "fields": [
                    {"drug_name": "Azithromycin", "canonical_drug_name": "Azithromycin", "dosage": "500mg", "frequency": "once daily", "duration": "for 5 days"},
                    {"drug_name": "Montelukast", "canonical_drug_name": "Montelukast", "dosage": "10mg", "frequency": "once daily", "duration": "for 14 days"},
                    {"drug_name": "Cetirizine", "canonical_drug_name": "Cetirizine", "dosage": "10mg", "frequency": "once daily", "duration": "for 10 days"},
                ],
                "expected_drugs": ["Azithromycin", "Montelukast", "Cetirizine"],
            }
        },

        # -------------------------------------------------------------
        # 9. Hospital Discharge Summary - Acute Coronary Syndrome
        # -------------------------------------------------------------
        {
            "id": "report_09_cardiac_discharge",
            "filename": "fake_discharge_09_cardiac_acs.pdf",
            "doc_type": "discharge",
            "title": "MEMORIAL HOSPITAL - DEPARTMENT OF CARDIOLOGY - DISCHARGE SUMMARY",
            "lines": [
                "Patient: James O'Connor",
                "Medical Record Number: MRN-94821",
                "Date of Admission: 2026-10-01",
                "Date of Discharge: 2026-10-06",
                "Attending Physician: Dr. Raymond Vance, MD, FACC",
                "----------------------------------------------------------------------",
                "# Diagnosis:",
                "Non-ST-Elevation Myocardial Infarction and coronary artery disease.",
                "----------------------------------------------------------------------",
                "# Procedures:",
                "Emergency coronary angiography and successful drug-eluting stent placement to proximal LAD.",
                "----------------------------------------------------------------------",
                "# Follow-up:",
                "Follow-up visit with Dr. Vance at cardiology clinic in 2 weeks. Strict adherence to dual antiplatelet therapy.",
            ],
            "ground_truth": {
                "id": "report_09_cardiac_discharge",
                "doc_type": "discharge",
                "verified": True,
                "fields": {
                    "diagnosis": "Non-ST-Elevation Myocardial Infarction and coronary artery disease.",
                    "canonical_diagnosis": "Non-ST-Elevation Myocardial Infarction and coronary artery disease.",
                    "procedures": "Emergency coronary angiography and successful drug-eluting stent placement to proximal LAD.",
                    "follow_up": "Follow-up visit with Dr. Vance at cardiology clinic in 2 weeks. Strict adherence to dual antiplatelet therapy.",
                },
                "key_diagnosis_terms": ["myocardial infarction", "coronary artery disease"],
            }
        },

        # -------------------------------------------------------------
        # 10. Hospital Discharge Summary - Laparoscopic Appendectomy
        # -------------------------------------------------------------
        {
            "id": "report_10_appendectomy_discharge",
            "filename": "fake_discharge_10_appendectomy.pdf",
            "doc_type": "discharge",
            "title": "VALLEY GENERAL HOSPITAL - GENERAL SURGERY - DISCHARGE SUMMARY",
            "lines": [
                "Patient: Emily Watson",
                "Medical Record Number: MRN-38102",
                "Date of Admission: 2026-10-12",
                "Date of Discharge: 2026-10-14",
                "Attending Surgeon: Dr. Hannah Abbott, MD, FACS",
                "----------------------------------------------------------------------",
                "# Diagnosis:",
                "Acute phlegmonous appendicitis with localized peritonitis.",
                "----------------------------------------------------------------------",
                "# Procedures:",
                "Emergency laparoscopic appendectomy and peritoneal cavity irrigation.",
                "----------------------------------------------------------------------",
                "# Follow-up:",
                "Surgical outpatient clinic visit in 10 days for wound check and evaluation. Avoid heavy lifting for 4 weeks.",
            ],
            "ground_truth": {
                "id": "report_10_appendectomy_discharge",
                "doc_type": "discharge",
                "verified": True,
                "fields": {
                    "diagnosis": "Acute phlegmonous appendicitis with localized peritonitis.",
                    "canonical_diagnosis": "Acute phlegmonous appendicitis with localized peritonitis.",
                    "procedures": "Emergency laparoscopic appendectomy and peritoneal cavity irrigation.",
                    "follow_up": "Surgical outpatient clinic visit in 10 days for wound check and evaluation. Avoid heavy lifting for 4 weeks.",
                },
                "key_diagnosis_terms": ["appendicitis", "peritonitis"],
            }
        },

        # -------------------------------------------------------------
        # 11. Hospital Discharge Summary - Community-Acquired Pneumonia
        # -------------------------------------------------------------
        {
            "id": "report_11_pneumonia_discharge",
            "filename": "fake_discharge_11_pneumonia.pdf",
            "doc_type": "discharge",
            "title": "ST. LUKE'S REGIONAL MEDICAL CENTER - DISCHARGE SUMMARY",
            "lines": [
                "Patient: Harold Wright",
                "Medical Record Number: MRN-51294",
                "Date of Admission: 2026-10-08",
                "Date of Discharge: 2026-10-13",
                "Attending Physician: Dr. Laura Croft, MD (Internal Medicine)",
                "----------------------------------------------------------------------",
                "# Diagnosis:",
                "Community-acquired bacterial pneumonia and mild acute hypoxemia.",
                "----------------------------------------------------------------------",
                "# Procedures:",
                "Serial chest radiography (X-ray), sputum microbiology culture, and intravenous antibiotic therapy.",
                "----------------------------------------------------------------------",
                "# Follow-up:",
                "Complete the prescribed oral antibiotic course. Repeat chest X-ray in 4 weeks and visit primary care physician in 2 weeks.",
            ],
            "ground_truth": {
                "id": "report_11_pneumonia_discharge",
                "doc_type": "discharge",
                "verified": True,
                "fields": {
                    "diagnosis": "Community-acquired bacterial pneumonia and mild acute hypoxemia.",
                    "canonical_diagnosis": "Community-acquired bacterial pneumonia and mild acute hypoxemia.",
                    "procedures": "Serial chest radiography (X-ray), sputum microbiology culture, and intravenous antibiotic therapy.",
                    "follow_up": "Complete the prescribed oral antibiotic course. Repeat chest X-ray in 4 weeks and visit primary care physician in 2 weeks.",
                },
                "key_diagnosis_terms": ["pneumonia", "hypoxemia"],
            }
        },
    ]

    index_manifest = []

    for sample in samples:
        pdf_path = os.path.join(test_data_dir, sample["filename"])
        gt_path = os.path.join(test_data_dir, f"{sample['id']}_ground_truth.json")

        create_pdf_from_text(pdf_path, sample["title"], sample["lines"])
        with open(gt_path, "w", encoding="utf-8") as f:
            json.dump(sample["ground_truth"], f, indent=2)

        index_manifest.append({
            "id": sample["id"],
            "filename": sample["filename"],
            "doc_type": sample["doc_type"],
            "title": sample["title"],
            "pdf_path": pdf_path,
            "gt_path": gt_path,
        })
        print(f"Generated: {sample['filename']} & ground truth JSON")

    manifest_path = os.path.join(test_data_dir, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(index_manifest, f, indent=2)
    print(f"\nManifest written with {len(samples)} test cases: {manifest_path}")
    return manifest_path


if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    generate_all_samples(current_dir)
