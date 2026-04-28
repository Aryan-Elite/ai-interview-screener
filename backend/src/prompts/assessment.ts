interface Criterion { name: string; description: string; weight: number; }

const DEFAULT_CRITERIA: Criterion[] = [
  { name: "Clarity",    description: "Does the candidate explain things simply and precisely?", weight: 1 },
  { name: "Warmth",     description: "Do they sound encouraging and kind?",                     weight: 1 },
  { name: "Simplicity", description: "Can they break down complex ideas for a child?",           weight: 1 },
  { name: "Patience",   description: "How do they handle confusion or frustration?",             weight: 1 },
  { name: "Fluency",    description: "Is their English clear and confident?",                    weight: 1 },
];

function toKey(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "_");
}

export function buildAssessmentPrompt(transcript: string, customCriteria: Criterion[] = []): string {
  const allCriteria = [...DEFAULT_CRITERIA, ...customCriteria];

  const dimensionList = allCriteria.map((c, i) => {
    const extra = c.weight > 1 ? ` [priority weight: ${c.weight}/5]` : "";
    return `${i + 1}. ${c.name}${extra} — ${c.description}`;
  }).join("\n");

  const jsonShape = allCriteria.map(c =>
    `  "${toKey(c.name)}": { "score": number, "quote": string }`
  ).join(",\n");

  return `You are evaluating a Cuemath tutor candidate based on this interview transcript.

IMPORTANT: Only evaluate lines labeled "Candidate:". Completely ignore lines labeled "AI:". Quotes must come only from "Candidate:" lines.

Score the candidate on these dimensions (1-5 each) with a direct quote as evidence:

${dimensionList}

Transcript:
${transcript}

Return JSON in exactly this shape:
{
${jsonShape},
  "recommendation": "Move Forward" | "Rejected",
  "summary": string,
  "recommendations": string[]
}

For "recommendations": if recommendation is "Rejected", provide 2-3 specific, actionable improvement tips based on the dimensions where the candidate scored below 3. If recommendation is "Move Forward", return an empty array.`;
}
