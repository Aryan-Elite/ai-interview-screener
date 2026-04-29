"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { candidateSignup, createInterview } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const GRADES = ["1-5", "3-8", "9-12"] as const;

export default function LandingPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [grade, setGrade] = useState<string>("3-8");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleStart() {
    if (!name.trim()) { setError("Please enter your full name"); return; }
    if (!email.trim()) { setError("Please enter your email"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    setError("");
    try {
      const signup = await candidateSignup(name.trim(), email.trim(), password);
      if (!signup.success) throw new Error(signup.error);
      const { token, candidateId } = signup.data;
      localStorage.setItem("token", token);
      localStorage.setItem("candidateId", candidateId);
      const interview = await createInterview(name.trim(), grade, candidateId);
      if (!interview.success) throw new Error(interview.error);
      sessionStorage.setItem(`iv_${interview.data.interviewId}`, JSON.stringify({
        firstQuestion: interview.data.firstQuestion,
        audio: interview.data.audio,
        candidateName: name.trim(),
      }));
      router.push(`/interview/${interview.data.interviewId}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gray-950">


      {/* Branding above card */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
            <span className="text-white font-bold">C</span>
          </div>
          <span className="text-white font-bold text-2xl tracking-wide">CueTalent</span>
        </div>
        <p className="text-violet-400 text-2xl font-semibold">AI Tutor Screener</p>
        <p className="text-gray-500 text-sm mt-1">Begin your journey as a Cuemath tutor</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl p-8 bg-gray-900 border border-gray-800 space-y-5">
        <div>
          <h2 className="text-white text-2xl font-semibold">Sign Up</h2>
          <p className="text-gray-500 text-base mt-1">Fill in your details to start the AI screening</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-gray-300 text-base font-medium">Full Name</Label>
            <Input id="name" type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              className="mt-1.5 h-11 text-base text-white bg-gray-800 border-gray-700 placeholder:text-gray-600" />
          </div>

          <div>
            <Label htmlFor="email" className="text-gray-300 text-base font-medium">Email address</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1.5 h-11 text-base text-white bg-gray-800 border-gray-700 placeholder:text-gray-600" />
          </div>

          <div>
            <Label htmlFor="password" className="text-gray-300 text-base font-medium">Password</Label>
            <p className="text-xs text-gray-600 mt-0.5 mb-1.5">You&apos;ll use this to check your result later</p>
            <Input id="password" type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleStart()}
              placeholder="Min. 6 characters"
              className="h-11 text-base text-white bg-gray-800 border-gray-700 placeholder:text-gray-600" />
          </div>

          <div>
            <Label className="text-gray-300 text-base font-medium">Grade Range You Teach</Label>
            <div className="flex gap-2 mt-1.5">
              {GRADES.map(g => (
                <button key={g} onClick={() => setGrade(g)}
                  className={`flex-1 py-2.5 rounded-lg text-base font-medium border transition-all ${
                    grade === g
                      ? "bg-violet-600 border-violet-600 text-white"
                      : "bg-gray-800 border-gray-700 text-gray-400 hover:border-violet-500"
                  }`}>
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-950/40 border border-red-900 rounded-lg px-4 py-2.5">{error}</p>
        )}

        <button onClick={handleStart} disabled={loading}
          className="w-full h-12 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-base transition-colors disabled:opacity-60">
          {loading ? "Setting up your interview..." : "Continue"}
        </button>

        <div className="flex flex-col items-center gap-2 pt-1">
          <Link href="/candidate/login"
            className="w-full text-center text-gray-400 font-medium border border-gray-700 hover:border-gray-500 hover:text-white px-3 py-1.5 rounded-lg transition-colors text-sm">
            Already applied? Check your result
          </Link>
          <Link href="/admin/login"
            className="w-full text-center text-violet-400 font-medium border border-violet-700 hover:border-violet-400 hover:text-violet-300 px-3 py-1.5 rounded-lg transition-colors text-sm">
            Admin Portal →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-6 text-gray-700 text-xs">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}
