"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAssessments } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AdminSidebar from "@/components/AdminSidebar";

type Assessment = {
  _id: string;
  candidateName: string;
  candidateEmail: string;
  gradeRange: string;
  overallScore: number;
  recommendation: "Move Forward" | "Hold";
  resultReleased: boolean;
  createdAt: string;
};

const FILTERS = ["All", "Move Forward", "Hold"] as const;

export default function AdminDashboard() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [filter, setFilter] = useState<string>("All");
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) { router.push("/admin/login"); return; }
    setAdminEmail(localStorage.getItem("adminEmail") ?? "");
    fetchAssessments();
  }, [router]);

  async function fetchAssessments(recommendation?: string) {
    setLoading(true);
    const res = await getAssessments(recommendation === "All" ? undefined : recommendation);
    if (!res.success) { router.push("/admin/login"); return; }
    setAssessments(res.data.assessments);
    setLoading(false);
  }

  function handleFilter(f: string) {
    setFilter(f);
    fetchAssessments(f);
  }

  return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar email={adminEmail} />

      <main className="flex-1 ml-60 p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Interviews</h1>
          <p className="text-gray-500 dark:text-gray-400 text-base mt-1">Review and manage all candidate screenings.</p>
        </div>

        <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 rounded-xl px-4 py-3.5 mb-6">
          <svg className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-0.5">AI + Human Review</p>
            <p className="text-sm text-blue-600 dark:text-blue-500 leading-relaxed">
              The AI is capable of independently evaluating candidates — but human review is always recommended to ensure every decision is accurate, fair, and context-aware. Use these scores as a starting point, not a final verdict.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-5">
          {FILTERS.map(f => (
            <Button key={f} variant={filter === f ? "default" : "outline"} size="sm"
              onClick={() => handleFilter(f)}
              className={`text-base h-9 px-4 ${filter === f
                ? "bg-violet-600 hover:bg-violet-700 text-white border-violet-600"
                : "text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
              {f}
            </Button>
          ))}
          <span className="ml-auto text-base text-gray-400 dark:text-gray-500">
            {assessments.length} candidate{assessments.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400 dark:text-gray-500 text-base">Loading candidates...</div>
        ) : assessments.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-16 text-center">
            <p className="text-gray-600 dark:text-gray-400 font-medium text-base mb-1">No candidates yet.</p>
            <p className="text-base text-gray-400 dark:text-gray-500 mb-5">Share your screening link to start receiving applications.</p>
            <div className="inline-block px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <p className="text-base text-gray-600 dark:text-gray-300 font-mono">
                {typeof window !== "undefined" ? window.location.origin : ""}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
                  <th className="text-left px-5 py-4 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Candidate</th>
                  <th className="text-left px-5 py-4 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Grade</th>
                  <th className="text-left px-5 py-4 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Score</th>
                  <th className="text-left px-5 py-4 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Recommendation</th>
                  <th className="text-left px-5 py-4 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Result</th>
                  <th className="text-left px-5 py-4 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((a, i) => (
                  <tr key={a._id} onClick={() => router.push(`/admin/candidate/${a._id}`)}
                    className={`cursor-pointer hover:bg-violet-50/50 dark:hover:bg-violet-950/20 transition-colors ${
                      i < assessments.length - 1 ? "border-b border-gray-100 dark:border-gray-800" : ""
                    }`}>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 text-base">{a.candidateName}</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{a.candidateEmail || "—"}</p>
                    </td>
                    <td className="px-5 py-4 text-base text-gray-500 dark:text-gray-400">{a.gradeRange}</td>
                    <td className="px-5 py-4">
                      <span className="font-bold text-gray-900 dark:text-gray-100 text-base">{a.overallScore}</span>
                      <span className="text-gray-400 dark:text-gray-500 text-sm">/5</span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="outline"
                        className={`text-sm ${a.recommendation === "Move Forward"
                          ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                          : "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"}`}>
                        {a.recommendation}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-base font-medium ${a.resultReleased
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-gray-400 dark:text-gray-500"}`}>
                        {a.resultReleased ? "Released" : "Pending"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-base text-gray-400 dark:text-gray-500">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
