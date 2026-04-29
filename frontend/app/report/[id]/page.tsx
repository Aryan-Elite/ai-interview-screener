"use client";
import Link from "next/link";

export default function ThankYouPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="inline-flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-base font-bold">C</div>
          <span className="text-[#8b949e] text-base font-medium">CueTalent</span>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8">
          <div className="w-14 h-14 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-5">
            <span className="text-indigo-400 text-2xl">✓</span>
          </div>
          <h2 className="text-2xl font-semibold text-[#f0f6fc] mb-3">Screening Complete</h2>
          <p className="text-[#8b949e] text-base leading-relaxed">
            Thank you for completing the AI screening. The team will review your interview and share the results with you shortly.
          </p>
        </div>

        <div className="mt-5 bg-[#161b22] border border-[#30363d] rounded-xl px-5 py-4 text-left">
          <p className="text-[#f0f6fc] text-base font-medium mb-1">1 retake available</p>
          <p className="text-[#8b949e] text-sm leading-relaxed">
            If you&apos;re not selected, you can retake the screening once. Log in to your result page to use it.
          </p>
        </div>

        <p className="mt-4 text-sm text-[#8b949e]">
          Want to check your result later?{" "}
          <Link href="/candidate/login" className="text-indigo-400 hover:underline">
            Log in here →
          </Link>
        </p>
      </div>
    </div>
  );
}
