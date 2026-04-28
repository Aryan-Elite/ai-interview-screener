const BASE = process.env.NEXT_PUBLIC_API_URL;

function authHeader(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function adminAuthHeader(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// --- Auth ---

export async function adminLogin(email: string) {
  const res = await fetch(`${BASE}/api/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.json();
}

export async function candidateSignup(name: string, email: string, password: string) {
  const res = await fetch(`${BASE}/api/auth/candidate/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  return res.json();
}

export async function candidateLogin(email: string, password: string) {
  const res = await fetch(`${BASE}/api/auth/candidate/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function getCandidateResult() {
  const res = await fetch(`${BASE}/api/candidate/result`, {
    headers: { "Content-Type": "application/json", ...authHeader() },
  });
  return res.json();
}

// --- Admin ---

export async function getAssessments(recommendation?: string) {
  const query = recommendation ? `?recommendation=${encodeURIComponent(recommendation)}` : "";
  const res = await fetch(`${BASE}/api/admin/assessments${query}`, {
    headers: { "Content-Type": "application/json", ...adminAuthHeader() },
  });
  return res.json();
}

export async function getAssessmentDetail(id: string) {
  const res = await fetch(`${BASE}/api/admin/assessments/${id}`, {
    headers: { "Content-Type": "application/json", ...adminAuthHeader() },
  });
  return res.json();
}

export async function toggleResultRelease(id: string) {
  const res = await fetch(`${BASE}/api/admin/assessments/${id}/release`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...adminAuthHeader() },
  });
  return res.json();
}

export async function castVote(id: string, vote: "move_forward" | "hold") {
  const res = await fetch(`${BASE}/api/admin/assessments/${id}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...adminAuthHeader() },
    body: JSON.stringify({ vote }),
  });
  return res.json();
}

// --- Interview ---

export async function createInterview(candidateName: string, gradeRange: string, candidateId?: string) {
  const res = await fetch(`${BASE}/api/interview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ candidateName, gradeRange, candidateId }),
  });
  return res.json();
}

export async function sendChat(interviewId: string, transcript: string, elapsedSeconds: number) {
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ interviewId, transcript, elapsedSeconds }),
  });
  return res.json();
}

export async function generateAssessment(
  interviewId: string,
  tabSwitches: { timestamp: number; timeElapsed: number }[] = []
) {
  const res = await fetch(`${BASE}/api/assess`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ interviewId, tabSwitches }),
  });
  return res.json();
}

export async function getTemplates() {
  const res = await fetch(`${BASE}/api/admin/templates`, {
    headers: { "Content-Type": "application/json", ...adminAuthHeader() },
  });
  return res.json();
}

export async function saveTemplate(
  gradeRange: string,
  customInstructions: string,
  criteria: { name: string; description: string; weight: number }[] = []
) {
  const res = await fetch(`${BASE}/api/admin/templates/${gradeRange}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...adminAuthHeader() },
    body: JSON.stringify({ customInstructions, criteria }),
  });
  return res.json();
}

export async function toggleTemplate(gradeRange: string) {
  const res = await fetch(`${BASE}/api/admin/templates/${gradeRange}/toggle`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...adminAuthHeader() },
  });
  return res.json();
}

export async function getReport(id: string) {
  const res = await fetch(`${BASE}/api/report/${id}`);
  return res.json();
}

export async function getSttToken(): Promise<string> {
  const res = await fetch(`${BASE}/api/stt-token`);
  const data = await res.json();
  return data.data.token;
}
