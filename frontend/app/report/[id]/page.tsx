"use client";
import Link from "next/link";

export default function ThankYouPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="inline-flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">C</div>
          <span className="text-[#8b949e] text-sm font-medium">Cuemath</span>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8">
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-indigo-400 text-xl">✓</span>
          </div>
          <h2 className="text-lg font-semibold text-[#f0f6fc] mb-2">Screening Complete</h2>
          <p className="text-[#8b949e] text-sm leading-relaxed">
            Thank you for completing the AI screening. The Cuemath team will review your interview and share the results with you shortly.
          </p>
        </div>

        <div className="mt-5 bg-[#161b22] border border-[#30363d] rounded-xl px-4 py-3 text-left">
          <p className="text-[#f0f6fc] text-sm font-medium mb-0.5">1 retake available</p>
          <p className="text-[#8b949e] text-xs leading-relaxed">
            If you&apos;re not selected, you can retake the screening once. Log in to your result page to use it.
          </p>
        </div>

        <p className="mt-4 text-xs text-[#8b949e]">
          Want to check your result later?{" "}
          <Link href="/candidate/login" className="text-indigo-400 hover:underline">
            Log in here →
          </Link>
        </p>
      </div>
    </div>
  );
}
