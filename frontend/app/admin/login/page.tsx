"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminLogin } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleLogin() {
    if (!email.trim()) { setError("Please enter your email"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await adminLogin(email.trim());
      if (!res.success) throw new Error(res.error);
      localStorage.setItem("adminToken", res.data.token);
      localStorage.setItem("adminEmail", email.trim());
      router.push("/admin/dashboard");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Login failed");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gray-950">

      {/* Branding above card */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
            <span className="text-white font-bold">V</span>
          </div>
          <span className="text-white font-bold text-xl tracking-wide">VoiceScreen</span>
        </div>
        <p className="text-violet-400 text-2xl font-semibold">Admin Portal</p>
        <p className="text-gray-500 text-sm mt-1">Review and manage candidate screenings</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl p-8 bg-gray-900 border border-gray-800 space-y-5">
        <div>
          <h2 className="text-white text-xl font-semibold">Sign In</h2>
          <p className="text-gray-500 text-sm mt-1">Only @cuemath.com email addresses are allowed</p>
        </div>

        <div>
          <Label htmlFor="email" className="text-gray-300 text-sm font-medium">Work Email</Label>
          <Input id="email" type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            placeholder="name@cuemath.com"
            className="mt-1.5 h-11 text-sm text-white bg-gray-800 border-gray-700 placeholder:text-gray-600" />
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-950/40 border border-red-900 rounded-lg px-4 py-2.5">{error}</p>
        )}

        <button onClick={handleLogin} disabled={loading}
          className="w-full h-11 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-colors disabled:opacity-60">
          {loading ? "Signing in..." : "Continue"}
        </button>

        <p className="text-center text-gray-600 text-sm">
          Not an admin?{" "}
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">
            Candidate sign up
          </Link>
        </p>
      </div>

      <p className="mt-6 text-gray-700 text-xs">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}
