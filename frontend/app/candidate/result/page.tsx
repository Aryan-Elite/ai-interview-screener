"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCandidateResult, retakeInterview } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import ThemeToggle from "@/components/ThemeToggle";

type ResultData = {
  status: "pending" | "released" | "no_interview";
  recommendation?: "Move Forward" | "Rejected";
  candidateName?: string;
  scores?: Record<string, number>;
  recommendations?: string[];
  canRetake?: boolean;
};

export default function CandidateResultPage() {
  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [retaking, setRetaking] = useState(false);
  const [error, setError] = useState("");
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

  async function handleRetake() {
    setRetaking(true);
    setError("");
    const res = await retakeInterview();
    if (!res.success) {
      setError(res.error ?? "Something went wrong");
      setRetaking(false);
      return;
    }
    sessionStorage.setItem(`iv_${res.data.interviewId}`, JSON.stringify({
      firstQuestion: res.data.firstQuestion,
      audio: res.data.audio,
      candidateName: data?.candidateName ?? "",
    }));
    router.push(`/interview/${res.data.interviewId}`);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-gray-400 dark:text-gray-500 text-base">Loading your result...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
            <span className="text-white font-bold">C</span>
          </div>
          <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">CueTalent</span>
        </div>

        {data?.candidateName && (
          <p className="text-gray-500 dark:text-gray-400 text-base mb-3 text-center">
            Hi, <span className="font-semibold text-gray-700 dark:text-gray-300">{data.candidateName}</span>
          </p>
        )}

        <Card className="shadow-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
          <CardContent className="p-8">
            {data?.status === "no_interview" && (
              <>
                <div className="text-5xl mb-5 text-center">🔍</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">No interview found</h2>
                <p className="text-gray-500 dark:text-gray-400 text-base text-center">We couldn&apos;t find a completed screening for your account.</p>
              </>
            )}

            {data?.status === "pending" && (
              <>
                <div className="text-5xl mb-5 text-center">⏳</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">Result pending</h2>
                <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed text-center">
                  Your screening is being reviewed by the team. Check back in a day or two.
                </p>
              </>
            )}

            {data?.status === "released" && data.recommendation === "Move Forward" && (
              <MoveForwardView data={data} />
            )}

            {data?.status === "released" && data.recommendation === "Rejected" && (
              <RejectedView data={data} onRetake={handleRetake} retaking={retaking} error={error} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MoveForwardView({ data }: { data: ResultData }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mx-auto mb-5">
          <span className="text-3xl">✓</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Congratulations!</h2>
        <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed">
          You&apos;ve cleared the AI screening and moved to the next round.
          Our team will reach out to you soon with next steps.
        </p>
      </div>

      {data.scores && Object.keys(data.scores).length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Your Scores</p>
          <div className="space-y-3">
            {Object.entries(data.scores).map(([dim, score]) => (
              <div key={dim}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{dim.replace(/_/g, " ")}</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{score}/5</span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${score * 20}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RejectedView({
  data,
  onRetake,
  retaking,
  error,
}: {
  data: ResultData;
  onRetake: () => void;
  retaking: boolean;
  error: string;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">✗</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Not selected this time</h2>
        <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed">
          Thank you for your time. Here&apos;s a breakdown of your performance.
        </p>
      </div>

      {data.scores && Object.keys(data.scores).length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Your Scores</p>
          <div className="space-y-3">
            {Object.entries(data.scores).map(([dim, score]) => (
              <div key={dim}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{dim.replace(/_/g, " ")}</span>
                  <span className={`text-sm font-bold ${score < 3 ? "text-red-500 dark:text-red-400" : "text-violet-600 dark:text-violet-400"}`}>
                    {score}/5
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${score < 3 ? "bg-red-400" : "bg-violet-500"}`}
                    style={{ width: `${score * 20}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.recommendations && data.recommendations.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">How to Improve</p>
          <ul className="space-y-2">
            {data.recommendations.map((tip, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                <span className="text-violet-500 font-bold mt-0.5">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.canRetake && (
        <div className="pt-2">
          <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/40 rounded-lg px-4 py-3 mb-4">
            <p className="text-sm text-violet-700 dark:text-violet-400 font-medium">You have 1 retake available</p>
            <p className="text-xs text-violet-600 dark:text-violet-500 mt-0.5">Review the feedback above, then start fresh when you&apos;re ready.</p>
          </div>
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <button
            onClick={onRetake}
            disabled={retaking}
            className="w-full h-11 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-base transition-colors disabled:opacity-60"
          >
            {retaking ? "Starting interview..." : "Retake Test"}
          </button>
        </div>
      )}
    </div>
  );
}
