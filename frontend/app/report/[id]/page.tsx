"use client";
import { use, useEffect, useState } from "react";
import { getReport } from "@/lib/api";

type DimensionScore = { score: number; quote: string };
type Assessment = {
  clarity: DimensionScore; warmth: DimensionScore; simplicity: DimensionScore;
  patience: DimensionScore; fluency: DimensionScore;
  overall: number; recommendation: "Move Forward" | "Hold"; summary: string;
};
type Report = { candidateName: string; assessment: Assessment };

const DIMENSIONS: { key: keyof Omit<Assessment, "overall" | "recommendation" | "summary">; label: string }[] = [
  { key: "clarity",    label: "Clarity" },
  { key: "warmth",     label: "Warmth" },
  { key: "simplicity", label: "Simplicity" },
  { key: "patience",   label: "Patience" },
  { key: "fluency",    label: "Fluency" },
];

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-[#30363d] rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all"
          style={{ width: `${score * 10}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-[#f0f6fc] w-8 text-right">{score}/10</span>
    </div>
  );
}

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getReport(id).then(res => {
      if (res.success) setReport(res.data);
      else setError(res.error ?? "Report not found");
    });
  }, [id]);

  if (error) return (
    <div className="min-h-screen flex items-center justify-center text-[#8b949e]">{error}</div>
  );
  if (!report) return (
    <div className="min-h-screen flex items-center justify-center text-[#8b949e]">Loading report...</div>
  );

  const { assessment, candidateName } = report;
  const passed = assessment.recommendation === "Move Forward";

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">C</div>
          <span className="text-[#8b949e] text-sm">Cuemath AI Screener</span>
        </div>

        {/* Candidate + recommendation */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[#8b949e] uppercase tracking-wider mb-1">Candidate</p>
            <p className="text-lg font-semibold text-[#f0f6fc]">{candidateName}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-[#8b949e] uppercase tracking-wider mb-1">Overall</p>
            <p className="text-3xl font-bold text-indigo-400">{assessment.overall}<span className="text-base text-[#8b949e]">/10</span></p>
          </div>
        </div>

        {/* Recommendation badge */}
        <div className={`rounded-xl px-5 py-3 border ${passed ? "bg-emerald-500/10 border-emerald-500/30" : "bg-amber-500/10 border-amber-500/30"}`}>
          <span className={`text-sm font-semibold ${passed ? "text-emerald-400" : "text-amber-400"}`}>
            {passed ? "✓ Move Forward" : "○ Hold"}
          </span>
          <p className="text-[#8b949e] text-sm mt-1">{assessment.summary}</p>
        </div>

        {/* Dimension scores */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 space-y-4">
          <p className="text-xs font-medium text-[#8b949e] uppercase tracking-wider">Dimension Scores</p>
          {DIMENSIONS.map(({ key, label }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-[#f0f6fc]">{label}</span>
              </div>
              <ScoreBar score={assessment[key].score} />
              <p className="text-xs text-[#8b949e] mt-1.5 italic">"{assessment[key].quote}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
