import { useEffect, useState } from "react";
import { useLanguage } from "../i18n/useLanguage";
import { pendingHelpExamples } from "./adminHelpExamples";
import { adminFloodExamples } from "./adminFloodExamples";

const sections = [
  { id: "help-requests", title: "Help requests" },
  { id: "flood-reports", title: "Flood reports" },
  { id: "shelters", title: "Shelters" },
  { id: "contributions", title: "Contributions" },
];

export default function AdminPage() {
  const { t } = useLanguage();
  const [counts, setCounts] = useState(null);
  const [message, setMessage] = useState("");
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/admin/dashboard", { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]) });
        if (!response.ok) throw new Error(response.status === 401 ? "Please sign in with your administrator account." : response.status === 403 ? "This page is available to administrators only." : "Unable to load requests. Please try again.");
        const body = await response.json();
        if (!controller.signal.aborted) setCounts(body.counts);
      } catch (error) {
        if (!controller.signal.aborted) setMessage(["Please sign in with your administrator account.", "This page is available to administrators only."].includes(error.message) ? error.message : "Unable to load requests. Please try again.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    load();
    return () => controller.abort();
  }, [retry]);

  function refresh() { setLoading(true); setMessage(""); setCounts(null); setRetry((value) => value + 1); }

  return <main id="main" tabIndex={-1} className="min-h-[80vh] bg-[#12343d] bg-[linear-gradient(rgba(4,20,24,.18),rgba(4,20,24,.18)),url('/admin-dashboard-background.png')] bg-cover bg-center bg-no-repeat text-white">
    <div className="mx-auto max-w-[1180px] px-4 py-8 min-[761px]:px-6 min-[761px]:py-12">
    <a href="/" className="font-semibold text-[#b5ead9] hover:underline">← {t("Back to homepage")}</a>
    <div className="my-6 flex flex-wrap items-center justify-between gap-4">
      <div><p className="mb-2 text-sm font-bold text-[#b5ead9]">FLOODGUARD ADMIN</p><h1 className="text-3xl font-bold">{t("Admin dashboard")}</h1></div>
      <button type="button" onClick={refresh} disabled={loading} className="rounded-xl bg-[#007e8d] px-5 py-3 font-bold text-white disabled:opacity-50">{t("Refresh list")}</button>
    </div>
    {loading && <p role="status">{t("Loading requests…")}</p>}
    {message && <p role="alert" className="rounded-xl border border-red-400 bg-red-50 p-5 text-red-900">{t(message)}</p>}
    {counts && <section aria-label={t("Pending requests")} className="grid gap-5 min-[600px]:grid-cols-2 min-[1000px]:grid-cols-4">{sections.map((section) => <article key={section.id} className="rounded-2xl border border-[#73aaa3] bg-[#e5f2ec]/95 p-6 text-[#153e50] shadow-lg backdrop-blur-sm dark:border-[#578e83] dark:bg-[#1c443e]/95 dark:text-[#e6f1f7]">
      <h2 className="text-xl font-bold">{t(section.title)}</h2><p className="my-4 text-4xl font-bold tabular-nums">{counts[section.id] + (section.id === "help-requests" ? pendingHelpExamples().length : section.id === "flood-reports" ? adminFloodExamples.length : 0)}</p><p className="text-sm">{t("Pending review")}</p>
      {section.id === "shelters" && <a href="/admin/shelters" className="mt-4 inline-block rounded-lg bg-[#007e8d] px-4 py-2 font-bold text-white hover:bg-[#005e6b]">{t("View shelters")} →</a>}
      {section.id === "help-requests" && <a href="/admin/help-requests" className="mt-4 inline-block rounded-lg bg-[#007e8d] px-4 py-2 font-bold text-white hover:bg-[#005e6b]">{t("View help requests")} →</a>}
      {section.id === "flood-reports" && <a href="/admin/flood-reports" className="mt-4 inline-block rounded-lg bg-[#007e8d] px-4 py-2 font-bold text-white hover:bg-[#005e6b]">{t("View flood reports")} →</a>}
      {section.id === "contributions" && <a href="/admin/contributions" className="mt-4 inline-block rounded-lg bg-[#007e8d] px-4 py-2 font-bold text-white hover:bg-[#005e6b]">{t("View contributions")} →</a>}
    </article>)}</section>}
    </div>
  </main>;
}
