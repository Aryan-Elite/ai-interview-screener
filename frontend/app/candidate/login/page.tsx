"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { candidateLogin } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ThemeToggle from "@/components/ThemeToggle";

export default function CandidateLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleLogin() {
    if (!email.trim()) { setError("Please enter your email"); return; }
    if (!password) { setError("Please enter your password"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await candidateLogin(email.trim(), password);
      if (!res.success) throw new Error(res.error);
      localStorage.setItem("token", res.data.token);
      router.push("/candidate/result");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Login failed");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:flex lg:w-[45%] bg-violet-50 dark:bg-violet-950/20 flex-col justify-center px-14 border-r border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2.5 mb-12">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
            <span className="text-white font-bold">C</span>
          </div>
          <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">CueTalent</span>
        </div>
        <h1 className="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-5 leading-tight">Welcome back!</h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed max-w-sm">
          Log in to check the status of your screening. Results are shared once reviewed by the team.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">C</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">CueTalent</span>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1.5">Check your result</h2>
          <p className="text-gray-500 dark:text-gray-400 text-base mb-8">Log in with the credentials you created during screening.</p>

          <div className="space-y-5">
            <div>
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-medium text-base">Email</Label>
              <Input id="email" type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="priya@gmail.com" className="mt-2 bg-white dark:bg-gray-900 text-base h-11" />
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-medium text-base">Password</Label>
              <Input id="password" type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="Your password" className="mt-2 bg-white dark:bg-gray-900 text-base h-11" />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
                <p className="text-red-600 dark:text-red-400 text-base">{error}</p>
              </div>
            )}

            <Button onClick={handleLogin} disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold h-11 text-base">
              {loading ? "Signing in..." : "Check Result →"}
            </Button>
          </div>

          <p className="text-center text-base text-gray-400 dark:text-gray-500 mt-7">
            New applicant?{" "}
            <Link href="/" className="text-violet-600 dark:text-violet-400 hover:underline">Apply here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
