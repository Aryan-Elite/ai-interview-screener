"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCandidateResult } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import ThemeToggle from "@/components/ThemeToggle";

type ResultData = {
  status: "pending" | "released" | "no_interview";
  recommendation?: "Move Forward" | "Hold";
  candidateName?: string;
};

export default function CandidateResultPage() {
  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/candidate/login"); return; }
    getCandidateResult().then(res => {
      if (!res.success) { router.push("/candidate/login"); return; }
      setData(res.data);
      setLoading(false);
    });
  }, [router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-gray-400 dark:text-gray-500 text-base">Loading your result...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
            <span className="text-white font-bold">V</span>
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">VoiceScreen</span>
        </div>

        {data?.candidateName && (
          <p className="text-gray-500 dark:text-gray-400 text-base mb-3">
            Hi, <span className="font-semibold text-gray-700 dark:text-gray-300">{data.candidateName}</span>
          </p>
        )}

        <Card className="shadow-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <CardContent className="p-10">
            {data?.status === "no_interview" && (
              <>
                <div className="text-5xl mb-5">🔍</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">No interview found</h2>
                <p className="text-gray-500 dark:text-gray-400 text-base">We couldn&apos;t find a completed screening for your account.</p>
              </>
            )}
            {data?.status === "pending" && (
              <>
                <div className="text-5xl mb-5">⏳</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Result pending</h2>
                <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed">
                  Your screening is being reviewed by the team. Check back in a day or two.
                </p>
              </>
            )}
            {data?.status === "released" && data.recommendation === "Move Forward" && (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mx-auto mb-5">
                  <span className="text-3xl">✓</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Congratulations!</h2>
                <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed">
                  You&apos;ve been shortlisted. The Cuemath team will reach out to you soon with next steps.
                </p>
              </>
            )}
            {data?.status === "released" && data.recommendation === "Hold" && (
              <>
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-5">
                  <span className="text-3xl">○</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Thank you for applying</h2>
                <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed">
                  We appreciate your time. We won&apos;t be moving forward at this stage, but we wish you all the best.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
