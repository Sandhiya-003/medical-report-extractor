/**
 * API client communicating with the MedLens AI FastAPI backend
 * All requests are user-isolated and persist strictly to the SQLite database.
 */

const API_BASE = "http://127.0.0.1:8000";

export function getCurrentUserEmail() {
  try {
    const saved = localStorage.getItem('medlens_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.email || '';
    }
  } catch {}
  return '';
}

export async function checkHealth(userEmail) {
  const email = userEmail || getCurrentUserEmail();
  const url = email 
    ? `${API_BASE}/api/health?user_email=${encodeURIComponent(email)}`
    : `${API_BASE}/api/health`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Backend server unavailable");
  return res.json();
}

export async function fetchReports(userEmail) {
  const email = userEmail || getCurrentUserEmail();
  const url = email
    ? `${API_BASE}/api/reports?user_email=${encodeURIComponent(email)}`
    : `${API_BASE}/api/reports`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load reports");
  return res.json();
}

export async function fetchReportById(reportId, userEmail) {
  const email = userEmail || getCurrentUserEmail();
  const url = email
    ? `${API_BASE}/api/reports/${reportId}?user_email=${encodeURIComponent(email)}`
    : `${API_BASE}/api/reports/${reportId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load report details");
  return res.json();
}

export async function deleteReport(reportId, userEmail) {
  const email = userEmail || getCurrentUserEmail();
  const url = email
    ? `${API_BASE}/api/reports/${reportId}?user_email=${encodeURIComponent(email)}`
    : `${API_BASE}/api/reports/${reportId}`;
  const res = await fetch(url, {
    method: "DELETE",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to delete report");
  }
  return res.json();
}

export async function uploadAndAnalyzeReport(file, userEmail) {
  const email = userEmail || getCurrentUserEmail();
  const formData = new FormData();
  formData.append("file", file);
  if (email) {
    formData.append("user_email", email);
  }

  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to analyze document");
  }
  return res.json();
}

export async function fetchSamples() {
  const res = await fetch(`${API_BASE}/api/samples`);
  if (!res.ok) throw new Error("Failed to list bundled samples");
  return res.json();
}

export async function analyzeBundledSample(relativePath, userEmail) {
  const email = userEmail || getCurrentUserEmail();
  const res = await fetch(`${API_BASE}/api/samples/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      relative_path: relativePath,
      user_email: email
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to analyze sample");
  }
  return res.json();
}

export async function fetchHistoryComparison(userEmail) {
  const email = userEmail || getCurrentUserEmail();
  const url = email
    ? `${API_BASE}/api/history/comparison?user_email=${encodeURIComponent(email)}`
    : `${API_BASE}/api/history/comparison`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load history comparison");
  return res.json();
}

export async function syncUserWithDb(userData) {
  const res = await fetch(`${API_BASE}/api/auth/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: userData.email,
      name: userData.name || "",
      dob: userData.dob || "",
      blood_group: userData.bloodGroup || userData.blood_group || "",
      mrn: userData.mrn || ""
    })
  });
  if (!res.ok) {
    console.warn("Could not sync user with SQLite db");
    return userData;
  }
  return res.json();
}

export async function updateUserDbProfile(profileData) {
  const res = await fetch(`${API_BASE}/api/user/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profileData)
  });
  if (!res.ok) {
    console.warn("Could not update user profile in SQLite db");
    return profileData;
  }
  return res.json();
}
