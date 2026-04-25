"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createInterview } from "@/lib/api";

const GRADES = ["1-5", "3-8", "9-12"] as const;

export default function LandingPage() {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState<string>("3-8");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleStart() {
    if (!name.trim()) { setError("Please enter your name"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await createInterview(name.trim(), grade);
      if (!res.success) throw new Error(res.error);
      sessionStorage.setItem(`iv_${res.data.interviewId}`, JSON.stringify({
        firstQuestion: res.data.firstQuestion,
        audio: res.data.audio,
      }));
      router.push(`/interview/${res.data.interviewId}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">C</div>
            <span className="text-[#8b949e] text-sm font-medium">Cuemath</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#f0f6fc] mb-2">AI Voice Screening</h1>
          <p className="text-[#8b949e] text-sm leading-relaxed">
            A 6-minute conversation to evaluate your communication, patience, and teaching style.
          </p>
        </div>

        {/* What to expect */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 mb-4">
          <p className="text-xs font-medium text-[#8b949e] uppercase tracking-wider mb-3">What to expect</p>
          <ul className="space-y-2 text-sm text-[#f0f6fc]">
            {["6-minute voice conversation", "Evaluated on communication & warmth", "Results available immediately"].map(item => (
              <li key={item} className="flex items-center gap-2">
                <span className="text-indigo-400">✓</span> {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Form */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 mb-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-[#8b949e] uppercase tracking-wider block mb-1.5">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleStart()}
              placeholder="Enter your full name"
              className="w-full bg-[#0d0f14] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#f0f6fc] placeholder-[#8b949e] focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#8b949e] uppercase tracking-wider block mb-1.5">Grade Range</label>
            <div className="flex gap-2">
              {GRADES.map(g => (
                <button
                  key={g}
                  onClick={() => setGrade(g)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    grade === g
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "bg-[#0d0f14] border-[#30363d] text-[#8b949e] hover:border-indigo-500"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

        <button
          onClick={handleStart}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
        >
          {loading ? "Starting interview..." : "Start Screening"}
        </button>
      </div>
    </div>
  );
}
