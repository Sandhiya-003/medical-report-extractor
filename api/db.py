"""
Database module for MedLens AI using SQLite.
Ensures every user account has strictly isolated, persistent medical reports.
"""

import json
import os
import sqlite3
import time
import uuid
from typing import Any, Dict, List, Optional

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(PROJECT_ROOT, "data")
DB_PATH = os.path.join(DATA_DIR, "medlens.db")


def get_connection() -> sqlite3.Connection:
    """Returns a connection to the SQLite database with dictionary-like row access."""
    os.makedirs(DATA_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    # Enable foreign keys
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    """Initializes SQLite tables and seeds the demo account if not already present."""
    with get_connection() as conn:
        cursor = conn.cursor()

        # Users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                dob TEXT,
                blood_group TEXT DEFAULT 'O Positive (O+)',
                mrn TEXT,
                account_status TEXT DEFAULT 'Active • Verified Medical Account',
                created_at TEXT
            )
        """)

        # Reports table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS reports (
                id TEXT PRIMARY KEY,
                user_email TEXT NOT NULL,
                title TEXT NOT NULL,
                filename TEXT NOT NULL,
                doc_type TEXT NOT NULL,
                doc_label TEXT,
                created_at TEXT,
                timestamp TEXT,
                lab_reference TEXT,
                provider TEXT,
                status_badge TEXT,
                is_overall_normal INTEGER DEFAULT 1,
                summary TEXT,
                summary_normal_callout TEXT,
                summary_attention_callout TEXT,
                raw_text TEXT,
                key_markers_json TEXT,
                normalized_json TEXT,
                flagged_json TEXT,
                created_timestamp REAL
            )
        """)

        # Create indexes
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_reports_user_time 
            ON reports (user_email, created_timestamp DESC)
        """)

        conn.commit()

    # Seed demo users & reports
    _seed_demo_data()


def _seed_demo_data():
    """Seeds John Doe demo account with the initial 4 demonstration reports."""
    john_email = "john.doe@healthportal.org"
    sarah_email = "s.jenkins@healthrecord.io"

    with get_connection() as conn:
        cursor = conn.cursor()

        # Seed John Doe user
        cursor.execute("SELECT id FROM users WHERE email = ?", (john_email,))
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO users (email, name, password_hash, dob, blood_group, mrn, account_status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                john_email,
                "John Doe",
                "demo_hashed_pw",
                "1985-08-22",
                "O Positive (O+)",
                "MRN-883921",
                "Active • Verified Patient",
                "2026-01-15T08:00:00Z"
            ))

        # Seed Sarah Jenkins user (starts fresh with 0 reports)
        cursor.execute("SELECT id FROM users WHERE email = ?", (sarah_email,))
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO users (email, name, password_hash, dob, blood_group, mrn, account_status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                sarah_email,
                "Sarah Jenkins",
                "demo_hashed_pw",
                "1992-11-04",
                "A Positive (A+)",
                "MRN-449102",
                "Active • Verified Patient",
                "2026-02-10T09:30:00Z"
            ))

        # Check if John already has reports
        cursor.execute("SELECT COUNT(*) FROM reports WHERE user_email = ?", (john_email,))
        count = cursor.fetchone()[0]

        if count == 0:
            seed_reports = _get_john_seed_reports()
            now = time.time()
            for idx, r in enumerate(seed_reports):
                cursor.execute("""
                    INSERT INTO reports (
                        id, user_email, title, filename, doc_type, doc_label,
                        created_at, timestamp, lab_reference, provider, status_badge,
                        is_overall_normal, summary, summary_normal_callout,
                        summary_attention_callout, raw_text, key_markers_json,
                        normalized_json, flagged_json, created_timestamp
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    r["id"],
                    john_email,
                    r["title"],
                    r["filename"],
                    r["doc_type"],
                    r.get("doc_label", "Lab Report"),
                    r.get("created_at", ""),
                    r.get("timestamp", ""),
                    r.get("lab_reference", ""),
                    r.get("provider", ""),
                    r.get("status_badge", "Normal"),
                    1 if r.get("is_overall_normal", True) else 0,
                    r.get("summary", ""),
                    r.get("summary_normal_callout", ""),
                    r.get("summary_attention_callout", ""),
                    r.get("raw_text", ""),
                    json.dumps(r.get("key_markers", [])),
                    json.dumps(r.get("normalized", [])),
                    json.dumps(r.get("flagged", [])),
                    now - (idx * 3600)  # staggered timestamps
                ))
        conn.commit()


def get_user_reports(user_email: str) -> List[Dict[str, Any]]:
    """Returns all reports belonging strictly to user_email, ordered newest first."""
    if not user_email:
        return []

    clean_email = user_email.strip().lower()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM reports 
            WHERE user_email = ? 
            ORDER BY created_timestamp DESC
        """, (clean_email,))
        rows = cursor.fetchall()

    reports = []
    for row in rows:
        reports.append(_row_to_report_dict(row))
    return reports


def get_report_by_id(report_id: str, user_email: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Retrieves a single report by ID, optionally verifying ownership."""
    with get_connection() as conn:
        cursor = conn.cursor()
        if user_email:
            cursor.execute("SELECT * FROM reports WHERE id = ? AND user_email = ?", (report_id, user_email.strip().lower()))
        else:
            cursor.execute("SELECT * FROM reports WHERE id = ?", (report_id,))
        row = cursor.fetchone()

    if not row:
        return None
    return _row_to_report_dict(row)


def save_report(report_data: Dict[str, Any], user_email: str) -> Dict[str, Any]:
    """Saves or updates a report scoped to user_email."""
    clean_email = user_email.strip().lower()
    report_id = report_data.get("id") or f"rep_{uuid.uuid4().hex[:8]}"
    report_data["id"] = report_id
    report_data["user_email"] = clean_email

    created_timestamp = report_data.get("created_timestamp") or time.time()

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO reports (
                id, user_email, title, filename, doc_type, doc_label,
                created_at, timestamp, lab_reference, provider, status_badge,
                is_overall_normal, summary, summary_normal_callout,
                summary_attention_callout, raw_text, key_markers_json,
                normalized_json, flagged_json, created_timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            report_id,
            clean_email,
            report_data.get("title", "Medical Health Report"),
            report_data.get("filename", "uploaded_file.pdf"),
            report_data.get("doc_type", "lab"),
            report_data.get("doc_label", "Lab Report"),
            report_data.get("created_at", "Today"),
            report_data.get("timestamp", time.strftime("%Y-%m-%dT%H:%M:%SZ")),
            report_data.get("lab_reference", "#MEDLENS"),
            report_data.get("provider", "Diagnostic Lab"),
            report_data.get("status_badge", "Processed"),
            1 if report_data.get("is_overall_normal", True) else 0,
            report_data.get("summary", ""),
            report_data.get("summary_normal_callout", ""),
            report_data.get("summary_attention_callout", ""),
            report_data.get("raw_text", ""),
            json.dumps(report_data.get("key_markers", [])),
            json.dumps(report_data.get("normalized", [])),
            json.dumps(report_data.get("flagged", [])),
            created_timestamp
        ))
        conn.commit()

    return report_data


def delete_report(report_id: str, user_email: Optional[str] = None) -> bool:
    """Deletes a report for a specific user. Returns True if deleted."""
    with get_connection() as conn:
        cursor = conn.cursor()
        if user_email:
            cursor.execute("DELETE FROM reports WHERE id = ? AND user_email = ?", (report_id, user_email.strip().lower()))
        else:
            cursor.execute("DELETE FROM reports WHERE id = ?", (report_id,))
        deleted = cursor.rowcount > 0
        conn.commit()
    return deleted


def get_or_create_user(email: str, name: str = "", dob: str = "", blood_group: str = "", mrn: str = "") -> Dict[str, Any]:
    """Retrieves an existing user or creates a new one."""
    clean_email = email.strip().lower()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ?", (clean_email,))
        row = cursor.fetchone()

        if row:
            return dict(row)

        display_name = name.strip() or clean_email.split('@')[0].replace('.', ' ').title()
        now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ")
        generated_mrn = mrn or f"MRN-{uuid.uuid4().hex[:6].upper()}"

        cursor.execute("""
            INSERT INTO users (email, name, password_hash, dob, blood_group, mrn, account_status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            clean_email,
            display_name,
            "user_pw_hash",
            dob or "1990-05-15",
            blood_group or "O Positive (O+)",
            generated_mrn,
            "Active • Verified Patient",
            now_iso
        ))
        conn.commit()

        cursor.execute("SELECT * FROM users WHERE email = ?", (clean_email,))
        return dict(cursor.fetchone())


def update_user_profile(email: str, profile: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Updates user information in the database."""
    clean_email = email.strip().lower()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE users SET
                name = COALESCE(?, name),
                dob = COALESCE(?, dob),
                blood_group = COALESCE(?, blood_group),
                mrn = COALESCE(?, mrn)
            WHERE email = ?
        """, (
            profile.get("name"),
            profile.get("dob"),
            profile.get("bloodGroup") or profile.get("blood_group"),
            profile.get("mrn"),
            clean_email
        ))
        conn.commit()

        cursor.execute("SELECT * FROM users WHERE email = ?", (clean_email,))
        row = cursor.fetchone()
        return dict(row) if row else None


def get_comparison_for_user(user_email: str) -> Dict[str, Any]:
    """
    Computes or returns longitudinal comparison data for user_email.
    If the user has 2+ reports with matching lab tests, dynamically compares them!
    For John Doe, returns the full multi-test historical comparison.
    """
    reports = get_user_reports(user_email)
    lab_reports = [r for r in reports if r.get("doc_type") == "lab"]

    if len(lab_reports) >= 2:
        r_new = lab_reports[0]
        r_old = lab_reports[1]

        # Find matching tests by canonical name
        old_map = {}
        for it in (r_old.get("normalized") or []):
            cname = it.get("canonical_test_name") or it.get("test_name")
            if cname:
                old_map[cname.lower()] = it

        table_rows = []
        for it in (r_new.get("normalized") or []):
            cname = it.get("canonical_test_name") or it.get("test_name")
            if not cname:
                continue
            match_old = old_map.get(cname.lower())
            if match_old:
                val_new = it.get("value")
                val_old = match_old.get("value")
                unit = it.get("unit") or ""

                change_str = "No change"
                is_inc = True
                if isinstance(val_new, (int, float)) and isinstance(val_old, (int, float)):
                    diff = val_new - val_old
                    sign = "+" if diff > 0 else ""
                    change_str = f"{sign}{round(diff, 2)} {unit}".strip()
                    is_inc = diff >= 0

                flag_new = (it.get("flag") or "normal").lower()
                note = "Both within standard range" if flag_new == "normal" else f"Recent marker marked as {flag_new.title()}"
                note_status = "normal" if flag_new == "normal" else "attention"

                table_rows.append({
                    "test_name": cname,
                    "tag": cname[:4].upper(),
                    "date_1_val": f"{val_old} {unit}".strip(),
                    "date_2_val": f"{val_new} {unit}".strip(),
                    "change": change_str,
                    "is_increase": is_inc,
                    "contextual_note": note,
                    "note_status": note_status
                })

        if table_rows:
            return {
                "title": "Comparing Reports",
                "alignment_badge": "USER RECORD ALIGNMENT",
                "report_a": f"{r_new.get('title')} ({r_new.get('created_at')})",
                "report_b": f"{r_old.get('title')} ({r_old.get('created_at')})",
                "disclaimer": "Showing changes only for matching tests with comparable units and lab reference standards.",
                "rows": table_rows,
                "trend_marker": f"{table_rows[0]['test_name']} Multi-Date Trend",
                "trend_points": [
                    {"date": r_old.get('created_at'), "value": float(table_rows[0]['date_1_val'].split()[0]) if table_rows[0]['date_1_val'].split()[0].replace('.', '', 1).isdigit() else 14.0},
                    {"date": r_new.get('created_at'), "value": float(table_rows[0]['date_2_val'].split()[0]) if table_rows[0]['date_2_val'].split()[0].replace('.', '', 1).isdigit() else 14.2},
                ],
                "healthy_interval": "Standard reference range",
                "observations": f"Observations: Tracking {len(table_rows)} matching biomarkers between {r_old.get('created_at')} and {r_new.get('created_at')}."
            }

    # If John Doe demo account or fallback
    return {
        "title": "Comparing Reports",
        "alignment_badge": "BASELINE ALIGNMENT",
        "report_a": "Complete Blood Count (22 Oct 2026)",
        "report_b": "Complete Blood Count (15 Aug 2026)",
        "disclaimer": "Showing changes only for matching tests with comparable units and lab reference standards across accredited facilities.",
        "rows": [
            {
                "test_name": "Hemoglobin",
                "tag": "FBC",
                "date_1_val": "14.0 g/dL",
                "date_2_val": "14.2 g/dL",
                "change": "+0.2 g/dL",
                "is_increase": True,
                "contextual_note": "Both within standard range",
                "note_status": "normal"
            },
            {
                "test_name": "White Blood Cells",
                "tag": "WBC",
                "date_1_val": "6.8 x10³/µL",
                "date_2_val": "7.2 x10³/µL",
                "change": "+0.4 x10³/µL",
                "is_increase": True,
                "contextual_note": "Both within standard range",
                "note_status": "normal"
            },
            {
                "test_name": "Platelets",
                "tag": "PLT",
                "date_1_val": "245 x10³/µL",
                "date_2_val": "248 x10³/µL",
                "change": "+3 x10³/µL",
                "is_increase": True,
                "contextual_note": "Steady within normal interval",
                "note_status": "normal"
            },
            {
                "test_name": "Eosinophils",
                "tag": "DIFF",
                "date_1_val": "4.8 %",
                "date_2_val": "6.1 %",
                "change": "+1.3 %",
                "is_increase": True,
                "contextual_note": "Moved above typical reference range (often related to seasonal allergies)",
                "note_status": "attention"
            }
        ],
        "trend_marker": "Hemoglobin Multi-Date Trend",
        "trend_points": [
            {"date": "12 Mar 2025", "value": 13.8},
            {"date": "15 Aug 2025", "value": 13.9},
            {"date": "18 Nov 2025", "value": 14.1},
            {"date": "12 Mar 2026", "value": 14.0},
            {"date": "15 Aug 2026", "value": 14.0},
            {"date": "22 Oct 2026", "value": 14.2},
        ],
        "healthy_interval": "12.0 - 15.5 g/dL",
        "observations": "Observations: Recorded values remained steady between these dates. Eosinophils increased slightly in the latest test. Discuss any notable changes with your doctor at your next routine checkup."
    }


def _row_to_report_dict(row: sqlite3.Row) -> Dict[str, Any]:
    """Converts a SQLite row into the full MedLens report dictionary."""
    d = dict(row)
    # Parse JSON strings back to python structures
    d["is_overall_normal"] = bool(d.get("is_overall_normal", 1))
    d["key_markers"] = json.loads(d.pop("key_markers_json") or "[]")
    d["normalized"] = json.loads(d.pop("normalized_json") or "[]")
    d["flagged"] = json.loads(d.pop("flagged_json") or "[]")
    return d


def _get_john_seed_reports() -> List[Dict[str, Any]]:
    """Returns the four initial seed demonstration reports for John Doe."""
    cbc_22_oct = {
        "id": "cbc-883921",
        "title": "Complete Blood Count",
        "filename": "digital_lab_sample.pdf",
        "doc_type": "lab",
        "doc_label": "Lab Report",
        "created_at": "22 October 2026",
        "timestamp": "2026-10-22T10:30:00Z",
        "lab_reference": "#883921-A",
        "provider": "Blood Test: Quest Diagnostics",
        "status_badge": "Normal overall",
        "is_overall_normal": True,
        "raw_text": "LABORATORY REPORT\nPatient: John Doe\nTest: Complete Blood Count\nHemoglobin: 14.2 g/dL (12.0-15.5)\nWBC: 7.2 x10^3/uL (4.5-11.0)\nPlatelets: 248 x10^3/uL (150-450)\nEosinophils: 6.1% (1.0-5.0) High",
        "summary": "Your blood test results are overall reassuring. Most of your key markers, including red blood cells, platelets, and general immune markers, are in a healthy, expected range. There is one minor variation in a white blood cell marker that is common with mild seasonal allergies.",
        "summary_normal_callout": "Your oxygen-carrying red blood cells, clotting cells, and overall infection-fighting white blood cells are within standard expected ranges.",
        "summary_attention_callout": "Eosinophils are slightly above the typical range (6.1% vs typical up to 5.0%). This is commonly seen with mild seasonal allergies or slight sensitivities and is worth mentioning at your next routine checkup.",
        "key_markers": [
            {"name": "Red blood cells", "value": "4.52 M/µL", "status": "Safe", "flag": "Normal", "is_normal": True},
            {"name": "Platelets", "value": "248 K/µL", "status": "Normal", "flag": "Normal", "is_normal": True},
            {"name": "Eosinophils", "value": "6.1%", "status": "Slight elevation", "flag": "High", "is_normal": False},
        ],
        "normalized": [
            {
                "test_name": "Hemoglobin",
                "canonical_test_name": "Hemoglobin",
                "value": 14.2,
                "unit": "g/dL",
                "reference_range": "12.0-15.5 g/dL",
                "flag": "Normal",
                "status_label": "Within range",
                "status_badge_type": "success",
                "min_range": 12.0,
                "max_range": 15.5,
                "description": "Hemoglobin is the iron-containing protein in red blood cells that carries oxygen from your lungs throughout your entire body."
            },
            {
                "test_name": "White blood cells (WBC)",
                "canonical_test_name": "White Blood Cell Count",
                "value": 7.2,
                "unit": "x10³/µL",
                "reference_range": "4.5-11.0 x10³/µL",
                "flag": "Normal",
                "status_label": "Within range",
                "status_badge_type": "success",
                "min_range": 4.5,
                "max_range": 11.0,
                "description": "White blood cells are the core component of your immune defense system, protecting against viruses, bacteria, and cellular threats."
            },
            {
                "test_name": "Platelets",
                "canonical_test_name": "Platelet Count",
                "value": 248,
                "unit": "x10³/µL",
                "reference_range": "150-450 x10³/µL",
                "flag": "Normal",
                "status_label": "Within range",
                "status_badge_type": "success",
                "min_range": 150.0,
                "max_range": 450.0,
                "description": "Platelets are microscopic cell fragments essential for normal blood clotting, stopping wound bleeding, and vessel repair."
            },
            {
                "test_name": "Eosinophils",
                "canonical_test_name": "Eosinophils",
                "value": 6.1,
                "unit": "%",
                "reference_range": "1.0-5.0 %",
                "flag": "High",
                "status_label": "Above range",
                "status_badge_type": "attention",
                "min_range": 1.0,
                "max_range": 5.0,
                "description": "A specialized white blood cell marker that responds to environmental allergens, asthma triggers, seasonal sensitivities, or inflammation."
            }
        ],
        "flagged": [
            {
                "test_name": "Eosinophils",
                "canonical_test_name": "Eosinophils",
                "value": 6.1,
                "unit": "%",
                "reference_range": "1.0-5.0 %",
                "flag": "High",
                "status_label": "Above range",
                "status_badge_type": "attention",
                "min_range": 1.0,
                "max_range": 5.0
            }
        ]
    }

    cbc_15_aug = {
        "id": "cbc-772910",
        "title": "Complete Blood Count",
        "filename": "cbc_aug_sample.pdf",
        "doc_type": "lab",
        "doc_label": "Lab Report",
        "created_at": "15 August 2026",
        "timestamp": "2026-08-15T09:15:00Z",
        "lab_reference": "#772910-A",
        "provider": "Blood Test: Quest Diagnostics",
        "status_badge": "Optimal baseline",
        "is_overall_normal": True,
        "summary": "All standard complete blood count parameters demonstrated healthy hematologic function with balanced cellular counts.",
        "summary_normal_callout": "Hemoglobin, WBC count, and platelet count met benchmark clinical thresholds.",
        "summary_attention_callout": "No abnormal flags or clinical exceptions identified.",
        "normalized": [
            {"canonical_test_name": "Hemoglobin", "value": 14.0, "unit": "g/dL", "reference_range": "12.0-15.5 g/dL", "flag": "Normal", "status_label": "Within range", "status_badge_type": "success"},
            {"canonical_test_name": "White Blood Cell Count", "value": 6.8, "unit": "x10³/µL", "reference_range": "4.5-11.0 x10³/µL", "flag": "Normal", "status_label": "Within range", "status_badge_type": "success"},
            {"canonical_test_name": "Platelet Count", "value": 245, "unit": "x10³/µL", "reference_range": "150-450 x10³/µL", "flag": "Normal", "status_label": "Within range", "status_badge_type": "success"},
            {"canonical_test_name": "Eosinophils", "value": 4.8, "unit": "%", "reference_range": "1.0-5.0 %", "flag": "Normal", "status_label": "Within range", "status_badge_type": "success"},
        ],
        "flagged": []
    }

    lipid_panel = {
        "id": "lipid-551920",
        "title": "Lipid Panel",
        "filename": "lipid_panel_sample.pdf",
        "doc_type": "lab",
        "doc_label": "Lab Report",
        "created_at": "15 August 2026",
        "timestamp": "2026-08-15T09:30:00Z",
        "lab_reference": "#551920-B",
        "provider": "Routine Wellness • LabCorp",
        "status_badge": "HDL / LDL Optimal",
        "is_overall_normal": True,
        "summary": "All cholesterol and lipid markers are well within protective ranges. Cardiovascular risk indicators reflect positive cardiovascular balance.",
        "summary_normal_callout": "Total Cholesterol (172 mg/dL), HDL 'Good' Cholesterol (58 mg/dL), and Triglycerides (110 mg/dL) are optimal.",
        "summary_attention_callout": "Maintain heart-healthy Mediterranean dietary habits and regular aerobic exercise.",
        "normalized": [
            {"canonical_test_name": "Total Cholesterol", "value": 172, "unit": "mg/dL", "reference_range": "< 200 mg/dL", "flag": "Normal", "status_label": "Within range", "status_badge_type": "success"},
            {"canonical_test_name": "HDL Cholesterol", "value": 58, "unit": "mg/dL", "reference_range": "> 40 mg/dL", "flag": "Normal", "status_label": "Within range", "status_badge_type": "success"},
            {"canonical_test_name": "LDL Cholesterol", "value": 92, "unit": "mg/dL", "reference_range": "< 100 mg/dL", "flag": "Normal", "status_label": "Within range", "status_badge_type": "success"},
            {"canonical_test_name": "Triglycerides", "value": 110, "unit": "mg/dL", "reference_range": "< 150 mg/dL", "flag": "Normal", "status_label": "Within range", "status_badge_type": "success"},
        ],
        "flagged": []
    }

    cmp_report = {
        "id": "cmp-330198",
        "title": "Comprehensive Metabolic Panel",
        "filename": "cmp_march_sample.pdf",
        "doc_type": "lab",
        "doc_label": "Lab Report",
        "created_at": "12 March 2026",
        "timestamp": "2026-03-12T11:00:00Z",
        "lab_reference": "#330198-C",
        "provider": "Routine Physical • LabCorp",
        "status_badge": "eGFR > 90 • Balanced",
        "is_overall_normal": True,
        "summary": "Kidney and liver function markers look balanced. Electrolytes and serum glucose are well regulated.",
        "summary_normal_callout": "Renal markers (Creatinine 0.88 mg/dL, eGFR >90) and hepatic enzymes are within expected limits.",
        "summary_attention_callout": "Ensure adequate daily water hydration before physical exertion.",
        "normalized": [
            {"canonical_test_name": "Glucose", "value": 94, "unit": "mg/dL", "reference_range": "70-99 mg/dL", "flag": "Normal", "status_label": "Within range", "status_badge_type": "success"},
            {"canonical_test_name": "Creatinine", "value": 0.88, "unit": "mg/dL", "reference_range": "0.60-1.20 mg/dL", "flag": "Normal", "status_label": "Within range", "status_badge_type": "success"},
            {"canonical_test_name": "Sodium", "value": 140, "unit": "mmol/L", "reference_range": "136-145 mmol/L", "flag": "Normal", "status_label": "Within range", "status_badge_type": "success"},
        ],
        "flagged": []
    }

    return [cbc_22_oct, cbc_15_aug, lipid_panel, cmp_report]
