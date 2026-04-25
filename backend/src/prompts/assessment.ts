export function buildAssessmentPrompt(transcript: string): string {
  return `You are evaluating a Cuemath tutor candidate based on this interview transcript.

IMPORTANT: Only evaluate lines labeled "Candidate:". Completely ignore lines labeled "AI:". The AI lines are interview questions — they are not part of the evaluation. Quotes must come only from "Candidate:" lines.

Score the candidate on 5 dimensions (1-10 each) with a direct quote from their own words as evidence.

Transcript:
${transcript}

Return JSON in exactly this shape:
{
  "clarity":    { "score": number, "quote": string },
  "warmth":     { "score": number, "quote": string },
  "simplicity": { "score": number, "quote": string },
  "patience":   { "score": number, "quote": string },
  "fluency":    { "score": number, "quote": string },
  "recommendation": "Move Forward" | "Hold",
  "summary": string
}`;
}

