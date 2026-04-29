"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getTemplates, saveTemplate, toggleTemplate } from "@/lib/api";
import AdminSidebar from "@/components/AdminSidebar";

function InfoTooltip({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative inline-flex items-center group">
      <button className="text-violet-400 dark:text-violet-500 hover:text-violet-600 dark:hover:text-violet-300 transition-colors flex-shrink-0">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
        </svg>
      </button>
      <div className="absolute left-6 top-0 z-50 w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 hidden group-hover:block">
        {children}
      </div>
    </div>
  );
}

type Criterion = { name: string; description: string; weight: number };

const GRADE_RANGES = ["1-5", "3-8", "9-12"] as const;
type GradeRange = typeof GRADE_RANGES[number];

type Template = {
  gradeRange: GradeRange;
  customInstructions: string;
  criteria: Criterion[];
  isActive: boolean;
};

const GRADE_LABELS: Record<GradeRange, { title: string; desc: string }> = {
  "1-5":  { title: "Grades 1–5",  desc: "Primary school — foundational concepts" },
  "3-8":  { title: "Grades 3–8",  desc: "Middle school — building problem-solving" },
  "9-12": { title: "Grades 9–12", desc: "High school — advanced topics" },
};

const BUILT_IN_DIMENSIONS = ["Clarity", "Warmth", "Simplicity", "Patience", "Fluency"];
const EMPTY_CRITERIA: Record<GradeRange, Criterion[]> = { "1-5": [], "3-8": [], "9-12": [] };
const BLANK_CRITERION: Criterion = { name: "", description: "", weight: 1 };

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [editing, setEditing] = useState<GradeRange | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<GradeRange | null>(null);
  const [adminEmail, setAdminEmail] = useState("");
  const [loading, setLoading] = useState(true);

  // Criteria section state
  const [criteriaTab, setCriteriaTab] = useState<GradeRange>("1-5");
  const [liveCriteria, setLiveCriteria] = useState<Record<GradeRange, Criterion[]>>(EMPTY_CRITERIA);
  const [addingCriterion, setAddingCriterion] = useState(false);
  const [newCriterion, setNewCriterion] = useState<Criterion>(BLANK_CRITERION);
  const [savingNew, setSavingNew] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastHovered = useRef(false);
  const toastExpired = useRef(false);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState<number | null>(null);
  const [deletingCriterion, setDeletingCriterion] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) { router.push("/admin/login"); return; }
    setAdminEmail(localStorage.getItem("adminEmail") ?? "");
    fetchTemplates();
  }, [router]);

  async function fetchTemplates() {
    const res = await getTemplates();
    if (!res.success) { router.push("/admin/login"); return; }
    const fetched: Template[] = res.data.templates;
    setTemplates(fetched);
    const live = { ...EMPTY_CRITERIA };
    for (const t of fetched) live[t.gradeRange] = t.criteria ?? [];
    setLiveCriteria(live);
    setLoading(false);
  }

  function getTemplate(range: GradeRange): Template {
    return templates.find(t => t.gradeRange === range) ?? { gradeRange: range, customInstructions: "", criteria: [], isActive: false };
  }

  async function persistCriteria(range: GradeRange, updated: Criterion[]) {
    const instructions = getTemplate(range).customInstructions;
    const res = await saveTemplate(range, instructions, updated);
    if (res.success) {
      setLiveCriteria(prev => ({ ...prev, [range]: updated }));
      setTemplates(prev => [...prev.filter(t => t.gradeRange !== range), res.data.template]);
    }
    return res.success;
  }

  function startEdit(range: GradeRange) {
    setDraft(getTemplate(range).customInstructions);
    setEditing(range);
  }

  async function handleSaveInstructions(range: GradeRange) {
    setSaving(true);
    const currentCriteria = liveCriteria[range];
    const res = await saveTemplate(range, draft, currentCriteria);
    if (res.success) {
      setTemplates(prev => [...prev.filter(t => t.gradeRange !== range), res.data.template]);
    }
    setSaving(false);
    setEditing(null);
  }

  async function handleToggle(range: GradeRange) {
    const hasSetup = !!getTemplate(range).customInstructions?.trim() || liveCriteria[range].length > 0;
    if (!hasSetup) return;
    setToggling(range);
    const res = await toggleTemplate(range);
    if (res.success) {
      setTemplates(prev => prev.map(t => t.gradeRange === range ? res.data.template : t));
    }
    setToggling(null);
  }

  async function handleAddCriterion() {
    if (!newCriterion.name.trim()) return;
    setSavingNew(true);
    const updated = [...liveCriteria[criteriaTab], newCriterion];
    const ok = await persistCriteria(criteriaTab, updated);
    if (ok) {
      setNewCriterion(BLANK_CRITERION);
      setAddingCriterion(false);
      const label = GRADE_LABELS[criteriaTab].title;
      toastHovered.current = false;
      toastExpired.current = false;
      setToast(`"${newCriterion.name}" has been added to ${label} and is now being scored.`);
      setTimeout(() => {
        if (toastHovered.current) {
          toastExpired.current = true;
        } else {
          setToast(null);
        }
      }, 10000);
    }
    setSavingNew(false);
  }

  async function handleDeleteCriterion(i: number) {
    setDeletingCriterion(true);
    const updated = liveCriteria[criteriaTab].filter((_, idx) => idx !== i);
    await persistCriteria(criteriaTab, updated);
    setConfirmDeleteIndex(null);
    setDeletingCriterion(false);
  }

  function switchCriteriaTab(range: GradeRange) {
    setCriteriaTab(range);
    setAddingCriterion(false);
    setConfirmDeleteIndex(null);
    setNewCriterion(BLANK_CRITERION);
  }

  if (loading) return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar email={adminEmail} />
      <main className="flex-1 ml-60 flex items-center justify-center text-gray-400">Loading...</main>
    </div>
  );

  const currentLive = liveCriteria[criteriaTab];

  return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar email={adminEmail} />

      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 bg-gray-950 border border-emerald-500/40 rounded-2xl shadow-2xl max-w-xs w-full overflow-hidden"
          onMouseEnter={() => { toastHovered.current = true; }}
          onMouseLeave={() => { toastHovered.current = false; if (toastExpired.current) setToast(null); }}
        >
          {/* Green accent bar at top */}
          <div className="h-1 w-full bg-emerald-500" />
          <div className="p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                <p className="text-sm font-semibold text-emerald-400">Criterion saved!</p>
              </div>
              <button onClick={() => setToast(null)} className="text-gray-500 hover:text-gray-300 flex-shrink-0 -mt-0.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <p className="text-base text-gray-100 font-medium leading-snug mb-3">{toast}</p>
            <div className="bg-gray-800 rounded-xl px-3 py-2.5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Next step</p>
              <p className="text-sm text-gray-200 leading-relaxed">
                Scroll up to <span className="text-violet-400 font-semibold">Custom Interview Templates</span> → find the <span className="text-violet-400 font-semibold">{GRADE_LABELS[criteriaTab].title}</span> card → flip its toggle to <span className="text-emerald-400 font-semibold">Live</span>.
              </p>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 ml-60 p-8 flex flex-col gap-12">

        {/* ── Interview Instructions ── */}
        <section>
          <div className="mb-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Interview Setup</h1>
            <p className="text-gray-500 dark:text-gray-400 text-base mt-1 max-w-2xl">
              Customize how the AI interviews candidates for each grade range.
            </p>
          </div>
          <hr className="border-gray-200 dark:border-gray-700 mb-6" />

          <div className="mt-8 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Custom Interview Templates</h2>
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">Optional</span>
              <InfoTooltip>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">What is this?</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  By default, the AI follows built-in interview guidelines. Use this to add extra instructions for a specific grade range — like topics to focus on or a different tone.
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mt-2">
                  Leave it empty if the default behavior works fine.
                </p>
              </InfoTooltip>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-base max-w-2xl">
              Add custom instructions for each grade range. They layer on top of built-in behavior and take priority when they overlap.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 max-w-5xl items-start">
            {GRADE_RANGES.map(range => {
              const t = getTemplate(range);
              const isEditing = editing === range;
              const hasInstructions = !!t.customInstructions?.trim();
              const criteriaCount = liveCriteria[range].length;
              const hasAnySetup = hasInstructions || criteriaCount > 0;

              return (
                <div key={range} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 flex flex-col gap-4">
                  <div>
                    <span className="inline-block text-xs font-semibold bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 px-2.5 py-1 rounded-full mb-1.5">
                      {GRADE_LABELS[range].title}
                    </span>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{GRADE_LABELS[range].desc}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t.isActive ? "Live in production" : "Paused"}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {t.isActive ? "New interviews use your setup" : hasInstructions ? "Falling back to built-in" : "No custom setup yet"}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggle(range)}
                      disabled={!hasAnySetup || toggling === range}
                      title={!hasAnySetup ? "Add instructions or criteria before activating" : ""}
                      className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${t.isActive ? "bg-violet-600" : "bg-gray-300 dark:bg-gray-700"}`}>
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${t.isActive ? "left-5" : "left-0.5"}`} />
                    </button>
                  </div>

                  {!isEditing ? (
                    <div className="flex-1 flex flex-col gap-2">
                      {hasInstructions
                        ? <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">{t.customInstructions}</p>
                        : <p className="text-sm text-gray-400 dark:text-gray-600 italic">No custom instructions yet.</p>}
                      {criteriaCount > 0 && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-500">
                          +{criteriaCount} custom scoring {criteriaCount === 1 ? "criterion" : "criteria"} active
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-lg p-3">
                        <p className="text-xs font-semibold text-violet-700 dark:text-violet-400 mb-1">How this works</p>
                        <p className="text-xs text-violet-600 dark:text-violet-500 leading-relaxed">
                          Your instructions are added on top of built-in AI behavior and take priority when they overlap.
                        </p>
                      </div>
                      <textarea
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        rows={4}
                        placeholder={`e.g. "Focus on how they handle distracted students. Ask about experience with ${range === "1-5" ? "young learners" : range === "3-8" ? "building study habits" : "exam pressure"}. Probe for real teaching examples."`}
                        className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:border-violet-400 placeholder:text-gray-400 dark:placeholder:text-gray-600 leading-relaxed"
                      />
                      <p className="text-xs text-gray-400 dark:text-gray-500 text-right">{draft.length} chars</p>
                      <div className="flex gap-2">
                        <button onClick={() => handleSaveInstructions(range)} disabled={saving}
                          className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60">
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button onClick={() => setEditing(null)}
                          className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-lg transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {!isEditing && (
                    <button onClick={() => startEdit(range)}
                      className="w-full py-2 text-sm font-medium text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-950/30 rounded-lg transition-colors">
                      {hasInstructions ? "Edit instructions" : "Add instructions"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <hr className="border-gray-200 dark:border-gray-700 my-8" />

        {/* ── Scoring Criteria ── */}
        <section className="max-w-3xl">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Scoring Criteria</h2>
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">Optional</span>
              <InfoTooltip>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">What is this?</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  The AI always scores every candidate on 5 built-in dimensions: Clarity, Warmth, Simplicity, Patience, and Fluency.
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mt-2">
                  Use this only if you need to evaluate something extra for a specific grade range. Otherwise, leave it empty.
                </p>
              </InfoTooltip>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-base max-w-xl">
              The AI scores every candidate on 5 default dimensions. If a grade range needs something extra, you can add custom criteria on top.
            </p>
          </div>

          {/* Grade tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit mb-6">
            {GRADE_RANGES.map(range => (
              <button key={range} onClick={() => switchCriteriaTab(range)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  criteriaTab === range
                    ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}>
                {GRADE_LABELS[range].title}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">

            {/* Built-in dimensions */}
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Default scoring criteria</p>
              <div className="flex flex-wrap gap-2">
                {BUILT_IN_DIMENSIONS.map(d => (
                  <span key={d} className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full border border-gray-200 dark:border-gray-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 flex-shrink-0" />
                    {d}
                  </span>
                ))}
              </div>
            </div>

            {/* Custom criteria */}
            <div className="px-6 py-5">
              <div className="flex items-center gap-2 mb-4">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Your criteria — {GRADE_LABELS[criteriaTab].title}
                </p>
                {currentLive.length > 0 && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">({currentLive.length}/7)</span>
                )}
              </div>

              {/* Empty state */}
              {currentLive.length === 0 && !addingCriterion && (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl mb-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">No custom criteria yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-600">
                    The AI uses the 5 built-in dimensions above.
                  </p>
                </div>
              )}

              {/* Live criteria rows */}
              {currentLive.length > 0 && (
                <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800 mb-4 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
                  {currentLive.map((c, i) => (
                    <div key={i}>
                      <div className="flex items-center gap-4 px-4 py-3.5">
                        {/* Green live dot */}
                        <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" title="Live — being scored" />

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{c.name}</p>
                          {c.description && (
                            <p className="text-sm text-gray-400 dark:text-gray-500 truncate">{c.description}</p>
                          )}
                        </div>

                        <span className="text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 px-2 py-0.5 rounded-full flex-shrink-0">
                          {c.weight}x
                        </span>

                        <button
                          onClick={() => setConfirmDeleteIndex(confirmDeleteIndex === i ? null : i)}
                          className="text-sm text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0 px-1">
                          Remove
                        </button>
                      </div>

                      {/* Inline delete confirmation */}
                      {confirmDeleteIndex === i && (
                        <div className="flex items-center justify-between px-4 py-3 bg-red-50 dark:bg-red-950/20 border-t border-red-100 dark:border-red-900/30">
                          <p className="text-sm text-red-700 dark:text-red-400">
                            Remove <span className="font-semibold">{c.name}</span>? Future {GRADE_LABELS[criteriaTab].title} candidates won't be scored on this.
                          </p>
                          <div className="flex gap-2 ml-4 flex-shrink-0">
                            <button
                              onClick={() => handleDeleteCriterion(i)}
                              disabled={deletingCriterion}
                              className="text-sm font-medium text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60">
                              {deletingCriterion ? "Removing..." : "Yes, remove"}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteIndex(null)}
                              className="text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
                              Keep it
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add criterion inline form */}
              {addingCriterion ? (
                <div className="border border-violet-200 dark:border-violet-800 rounded-xl p-4 bg-violet-50/50 dark:bg-violet-950/10 flex flex-col gap-3">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">New criterion</p>
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={newCriterion.name}
                      onChange={e => setNewCriterion(p => ({ ...p, name: e.target.value }))}
                      placeholder="Name  e.g. Enthusiasm"
                      autoFocus
                      className="text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-violet-400 placeholder:text-gray-400"
                    />
                    <input
                      type="text"
                      value={newCriterion.description}
                      onChange={e => setNewCriterion(p => ({ ...p, description: e.target.value }))}
                      placeholder="What to evaluate  e.g. Does the candidate seem genuinely excited about teaching?"
                      className="text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-violet-400 placeholder:text-gray-400"
                    />
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">Weight</label>
                      <select
                        value={newCriterion.weight}
                        onChange={e => setNewCriterion(p => ({ ...p, weight: Number(e.target.value) }))}
                        className="text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-violet-400 w-20">
                        {[1, 2, 3, 4, 5].map(w => <option key={w} value={w}>{w}x</option>)}
                      </select>
                      <InfoTooltip>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">What does weight mean?</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                          How much this criterion affects the overall score compared to the 5 built-in ones.
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mt-2">
                          <span className="font-medium text-violet-600 dark:text-violet-400">2x</span> = counts twice as much as Clarity or Warmth.
                          <span className="font-medium text-violet-600 dark:text-violet-400"> 1x</span> = treated equally.
                        </p>
                      </InfoTooltip>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleAddCriterion}
                      disabled={savingNew || !newCriterion.name.trim()}
                      className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
                      {savingNew ? "Adding..." : "Add criterion"}
                    </button>
                    <button
                      onClick={() => { setAddingCriterion(false); setNewCriterion(BLANK_CRITERION); }}
                      className="flex-1 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium rounded-lg transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : currentLive.length < 7 ? (
                <button
                  onClick={() => setAddingCriterion(true)}
                  className="flex items-center gap-2 text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                  Add a criterion
                </button>
              ) : (
                <p className="text-sm text-gray-400 dark:text-gray-600">Maximum 7 criteria reached.</p>
              )}
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
