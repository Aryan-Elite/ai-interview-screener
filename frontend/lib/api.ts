const BASE = process.env.NEXT_PUBLIC_API_URL;

export async function createInterview(candidateName: string, gradeRange: string) {
  const res = await fetch(`${BASE}/api/interview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ candidateName, gradeRange }),
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

export async function generateAssessment(interviewId: string) {
  const res = await fetch(`${BASE}/api/assess`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ interviewId }),
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
