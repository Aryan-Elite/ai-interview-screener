"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAssessmentDetail, toggleResultRelease, castVote } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminSidebar from "@/components/AdminSidebar";

type Score = Record<string, number>;
type Quote = { dimension: string; quote: string };
type Vote = { adminEmail: string; vote: "move_forward" | "rejected"; votedAt: string };
type Message = { role: "assistant" | "user"; content: string; timestamp: string };
type Assessment = {
  _id: string;
  candidateName: string;
  candidateEmail: string;
  gradeRange: string;
  scores: Score;
  overallScore: number;
  recommendation: "Move Forward" | "Rejected";
  summary: string;
  quotes: Quote[];
  cheatFlags: { type: string; segment: string; timestamp: number; reason: string }[];
  votes: Vote[];
  resultReleased: boolean;
  createdAt: string;
};

export default function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [transcript, setTranscript] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [releasing, setReleasing] = useState(false);
  const [voting, setVoting] = useState(false);
  const [pendingVote, setPendingVote] = useState<"move_forward" | "rejected" | null>(null);
  const [adminEmail, setAdminEmail] = useState("");
  const [showTranscript, setShowTranscript] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) { router.push("/admin/login"); return; }
    setAdminEmail(localStorage.getItem("adminEmail") ?? "");
    getAssessmentDetail(id).then(res => {
      if (!res.success) { router.push("/admin/dashboard"); return; }
      setAssessment(res.data.assessment);
      setTranscript(res.data.transcript);
      setLoading(false);
    });
  }, [id, router]);

  async function handleRelease() {
    if (!assessment) return;
    setReleasing(true);
    const res = await toggleResultRelease(id);
    if (res.success) setAssessment(a => a ? { ...a, resultReleased: res.data.resultReleased } : a);
    setReleasing(false);
  }

  async function confirmVote() {
    if (!pendingVote) return;
    setVoting(true);
    setPendingVote(null);
    const res = await castVote(id, pendingVote);
    if (res.success) setAssessment(a => a ? { ...a, votes: res.data.votes } : a);
    setVoting(false);
  }

  if (loading) return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar email={adminEmail} />
      <main className="flex-1 ml-60 flex items-center justify-center text-gray-400 text-base">Loading...</main>
    </div>
  );
  if (!assessment) return null;

  const myVote = assessment.votes.find(v => v.adminEmail === adminEmail)?.vote;
  const moveForwardCount = assessment.votes.filter(v => v.vote === "move_forward").length;
  const rejectedCount = assessment.votes.filter(v => v.vote === "rejected").length;

  const isForward = pendingVote === "move_forward";

  return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar email={adminEmail} />

      {pendingVote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-sm mx-4 rounded-2xl border shadow-xl p-7 ${isForward
            ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-700"
            : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-700"}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${isForward
              ? "bg-emerald-100 dark:bg-emerald-900"
              : "bg-red-100 dark:bg-red-900"}`}>
              <span className="text-2xl">{isForward ? "👍" : "👎"}</span>
            </div>
            <h3 className={`text-lg font-bold text-center mb-1 ${isForward
              ? "text-emerald-800 dark:text-emerald-200"
              : "text-red-800 dark:text-red-200"}`}>
              {isForward ? "Move Forward?" : "Reject Candidate?"}
            </h3>
            <p className={`text-sm text-center mb-6 ${isForward
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-red-700 dark:text-red-400"}`}>
              You are about to cast your vote for <span className="font-semibold">{assessment.candidateName}</span>.
              This can be changed later.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setPendingVote(null)}
                className="flex-1 h-10 text-base border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400">
                Cancel
              </Button>
              <Button onClick={confirmVote} disabled={voting}
                className={`flex-1 h-10 text-base text-white ${isForward
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-red-600 hover:bg-red-700"}`}>
                {voting ? "Saving..." : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 ml-60 p-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-base text-gray-400 dark:text-gray-500 mb-6">
          <Link href="/admin/dashboard" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Dashboard</Link>
          <span>›</span>
          <span className="text-gray-700 dark:text-gray-300 font-medium">{assessment.candidateName}</span>
        </div>

        <div className="space-y-5">
          {/* Header card */}
          <Card className="shadow-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardContent className="p-6 flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{assessment.candidateName}</h1>
                <p className="text-base text-gray-400 dark:text-gray-500 mt-1">
                  {assessment.candidateEmail || "No email"} · Grade {assessment.gradeRange}
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{new Date(assessment.createdAt).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-5xl font-bold text-gray-900 dark:text-gray-100">
                  {assessment.overallScore}<span className="text-xl font-normal text-gray-400 dark:text-gray-500">/5</span>
                </p>
                <Badge className={`mt-2 text-sm ${
                  assessment.recommendation === "Move Forward"
                    ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                    : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
                }`} variant="outline">
                  {assessment.recommendation}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* AI Summary */}
          {assessment.summary && (
            <Card className="shadow-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <CardHeader className="pb-2 pt-5 px-6">
                <CardTitle className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">AI Summary</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">{assessment.summary}</p>
              </CardContent>
            </Card>
          )}

          {/* Dimension Scores */}
          <Card className="shadow-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader className="pb-2 pt-5 px-6">
              <CardTitle className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Dimension Scores</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-5">
              {Object.entries(assessment.scores).map(([dim, score]) => {
                const quote = assessment.quotes.find(q => q.dimension === dim)?.quote;
                return (
                  <div key={dim}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-base font-medium text-gray-700 dark:text-gray-300 capitalize">{dim}</span>
                      <span className="text-base font-bold text-violet-600 dark:text-violet-400">{score}/5</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${score * 20}%` }} />
                    </div>
                    {quote && <p className="text-sm text-gray-400 dark:text-gray-500 mt-2 italic">&quot;{quote}&quot;</p>}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Team Voting */}
          <Card className="shadow-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardHeader className="pb-2 pt-5 px-6">
              <CardTitle className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Team Vote</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">Your vote is advisory and separate from the AI recommendation.</p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setPendingVote("move_forward")} disabled={voting || !!pendingVote}
                  className={`flex-1 text-base h-11 ${myVote === "move_forward"
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                    : "text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"}`}>
                  👍 Move Forward {moveForwardCount > 0 && `(${moveForwardCount})`}
                </Button>
                <Button variant="outline" onClick={() => setPendingVote("rejected")} disabled={voting || !!pendingVote}
                  className={`flex-1 text-base h-11 ${myVote === "rejected"
                    ? "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                    : "text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"}`}>
                  👎 Reject {rejectedCount > 0 && `(${rejectedCount})`}
                </Button>
              </div>
              {assessment.votes.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {assessment.votes.map(v => (
                    <p key={v.adminEmail} className="text-sm text-gray-400 dark:text-gray-500">
                      {v.adminEmail} →{" "}
                      <span className={v.vote === "move_forward"
                        ? "text-emerald-600 dark:text-emerald-400 font-medium"
                        : "text-red-500 dark:text-red-400 font-medium"}>
                        {v.vote === "move_forward" ? "Move Forward" : "Reject"}
                      </span>
                    </p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Release Result */}
          <Card className="shadow-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-gray-800 dark:text-gray-200">Release Result to Candidate</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  {assessment.resultReleased
                    ? "Candidate can now see their result when they log in."
                    : "Candidate sees 'Result Pending'. Toggle to release."}
                </p>
              </div>
              <Button variant="outline" onClick={handleRelease} disabled={releasing}
                className={`text-base h-10 ${assessment.resultReleased
                  ? "border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                  : "text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"}`}>
                {releasing ? "..." : assessment.resultReleased ? "Released ✓" : "Release"}
              </Button>
            </CardContent>
          </Card>

          {/* Tab Switch Count */}
          {(() => {
            const count = assessment.cheatFlags.filter(f => f.type === "tab_switch").length;
            return (
              <Card className={`shadow-sm bg-white dark:bg-gray-900 ${count > 0 ? "border-amber-200 dark:border-amber-800" : "border-gray-200 dark:border-gray-800"}`}>
                <CardContent className="px-6 py-5 flex items-center justify-between">
                  <div>
                    <p className={`text-base font-semibold ${count > 0 ? "text-amber-600 dark:text-amber-500" : "text-gray-700 dark:text-gray-300"}`}>
                      Tab switches during interview
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
                      {count === 0
                        ? "No tab switches detected — session looks clean"
                        : `Candidate left the interview tab ${count} ${count === 1 ? "time" : "times"}`}
                    </p>
                  </div>
                  <span className={`text-3xl font-bold ${count > 0 ? "text-amber-500" : "text-emerald-500"}`}>{count}</span>
                </CardContent>
              </Card>
            );
          })()}

          {/* Transcript */}
          <Card className="shadow-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
            <CardContent className="p-0">
              <button onClick={() => setShowTranscript(s => !s)}
                className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors rounded-xl">
                <span className="text-base font-semibold text-gray-800 dark:text-gray-200">Full Transcript</span>
                <span className="text-violet-600 dark:text-violet-400 text-base font-medium">
                  {showTranscript ? "▲ Hide" : "▼ Show transcript"}
                </span>
              </button>

              {showTranscript && (
                <div className="px-6 pb-6 border-t border-gray-100 dark:border-gray-800">
                  {transcript.length === 0 ? (
                    <p className="text-base text-gray-400 dark:text-gray-500 pt-5">No transcript available.</p>
                  ) : (
                    <div className="space-y-4 pt-5">
                      {transcript.map((m, i) => (
                        <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                          <div className={`text-base rounded-xl px-4 py-3 max-w-[80%] leading-relaxed ${
                            m.role === "assistant"
                              ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                              : "bg-violet-600 text-white"
                          }`}>
                            <p className={`text-xs font-semibold mb-1.5 ${m.role === "assistant" ? "text-gray-400 dark:text-gray-500" : "text-violet-200"}`}>
                              {m.role === "assistant" ? "AI Interviewer" : "Candidate"}
                            </p>
                            {m.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
