import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/useLanguage";

export default function ShelterSupplyRequests({ compact = false }) {
  const { t, language } = useLanguage();
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingId, setPendingId] = useState(null);
  const busyRef = useRef(false);
  const claimRef = useRef(null);
  useEffect(() => () => claimRef.current?.abort(), []);
  useEffect(() => {
    const refreshList = () => setRetry((value) => value + 1);
    window.addEventListener("shelter-supplies-updated", refreshList);
    return () => window.removeEventListener("shelter-supplies-updated", refreshList);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let timer;
    async function load() {
      try {
        const response = await fetch(`/api/shelter-supplies?page=${page}`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]) });
        const body = await response.json();
        if (!response.ok || !body.success || !Array.isArray(body.requests)) throw new Error("Unable to load requests");
        if (!controller.signal.aborted) { setData(body); setError(false); }
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) timer = setTimeout(load, 15000);
      }
    }
    load();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [page, retry]);

  function refresh() { setError(false); setRetry((value) => value + 1); }

  async function claim(request) {
    if (busyRef.current) return;
    busyRef.current = true; setPendingId(request.id); setMessage(""); setNotice("");
    const controller = new AbortController();
    claimRef.current = controller;
    try {
      const response = await fetch(`/api/shelter-supplies/${request.id}/claim`, { method: "POST", headers: { "X-CSRF-Protection": "1" }, signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]) });
      if (controller.signal.aborted) return;
      if (response.ok) {
        setData((current) => current ? { ...current, requests: current.requests.map((item) => item.id === request.id ? { ...item, claimed: true } : item) } : current);
        setNotice("You have taken this shelter supply request.");
      } else {
        setMessage(response.status === 401 ? "Please sign in as a volunteer or donor to take a request." : response.status === 403 ? "Only volunteer or donor accounts can take help requests." : response.status === 409 ? "This request is already taken or unavailable. Refresh the list." : "Unable to take this request. Please try again.");
      }
      refresh();
    } catch {
      if (!controller.signal.aborted) { setMessage("Connection interrupted. Refresh the list before trying again."); refresh(); }
    } finally {
      busyRef.current = false;
      if (!controller.signal.aborted) setPendingId(null);
    }
  }

  return <section id="shelter-supply-notices" aria-labelledby="shelter-needs-title" className="my-10 scroll-mt-6 rounded-[28px] border border-[#79b5af] bg-[#edf6f4] p-6 min-[761px]:p-9 dark:border-[#4b817b] dark:bg-[#102f34]">
    <div className="flex flex-wrap justify-between gap-5"><div><p className="mb-3 text-xs font-bold tracking-widest text-[#007e8d] uppercase dark:text-[#99e4c9]">{t("Support your community")}</p><h2 id="shelter-needs-title" className="text-3xl font-bold">{t("What shelters need")}</h2><p className="mt-3 max-w-2xl text-sm leading-7">{t("Shelters can report supplies that are running out. Volunteers and donors can take responsibility for providing them.")}</p></div><div className="flex flex-wrap gap-3 self-start"><button type="button" onClick={refresh} className="rounded-xl border border-[#73aaa3] px-4 py-3 font-semibold">{t("Refresh list")}</button><a href="/shelters#shelter-supply-request" className="rounded-xl bg-[#007e8d] px-4 py-3 font-bold text-white">{t("Report shortage")}</a>{compact && <a href="/shelters#shelter-needs-title" className="rounded-xl border border-[#73aaa3] px-4 py-3 font-semibold">{t("View all needs")} →</a>}</div></div>
    {message && <p role="alert" className="mt-5 rounded-xl border border-red-400 bg-red-50 p-4 text-red-900">{t(message)}</p>}
    {notice && <p role="status" className="mt-5 rounded-xl border border-[#73aaa3] p-4">{t(notice)}</p>}
    {error ? <p role="alert" className="mt-6">{t("Unable to load help requests. Please refresh the list.")}</p> : !data ? <p role="status" className="mt-6">{t("Loading requests…")}</p> : <>
      {!data.requests.length && <p className="mt-6 rounded-2xl border border-[#9cc6bc] bg-[#d8ebe2] p-6 dark:bg-[#1b423b]">{t("No shelter shortages have been reported yet.")}</p>}
      <ul className="mt-6 grid list-none gap-5 p-0 min-[761px]:grid-cols-2">{data.requests.slice(0, compact ? 3 : 12).map((request) => <li key={request.id} className="min-w-0 rounded-2xl border border-[#9cc6bc] bg-white p-6 shadow-sm dark:border-[#416f68] dark:bg-[#1b423b]">
        <div className="flex flex-wrap justify-between gap-3"><h3 className="text-xl font-bold">{request.shelterName}</h3><span className={`rounded-full px-3 py-1 text-sm font-semibold ${request.claimed ? "bg-[#cce6db] text-[#005849]" : "bg-[#f4d5bd] text-[#773f14]"}`}>{t(request.claimed ? "Already taken" : "Not taken yet")}</span></div>
        <p className="mt-3 font-semibold">{request.nearestTown}</p><p className="mt-2 text-sm">{new Intl.DateTimeFormat(language === "si" ? "si-LK" : "en-LK", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Colombo" }).format(new Date(request.createdAt))}</p>
        <ul className="mt-4 flex list-none flex-wrap gap-2 p-0">{request.supplies.map((supply) => <li key={supply} className="rounded-full bg-[#d8ebe2] px-3 py-1 text-sm dark:bg-[#12343d]">{t(supply)}</li>)}</ul>
        {request.otherSupplies && <p className="mt-4 whitespace-pre-wrap wrap-break-word font-semibold">{request.otherSupplies}</p>}<p className="mt-4 whitespace-pre-wrap wrap-break-word leading-7">{request.details}</p>
        <button type="button" disabled={request.claimed || pendingId !== null} onClick={() => claim(request)} className="mt-5 rounded-xl bg-[#007e8d] px-5 py-3 font-bold text-white enabled:hover:bg-[#005e6b] disabled:cursor-not-allowed disabled:opacity-50">{t(request.claimed ? "Already taken" : pendingId === request.id ? "Taking request…" : "Take this request")}</button>
      </li>)}</ul>
      {!compact && (page > 1 || data.hasMore) && <nav aria-label={t("Supply request pages")} className="mt-6 flex items-center gap-4"><button type="button" disabled={page === 1 || pendingId !== null} onClick={() => { setData(null); setError(false); setPage(page - 1); }} className="rounded-lg border border-[#73aaa3] px-4 py-2 disabled:opacity-40">{t("Previous")}</button><span>{t("Page")} {page}</span><button type="button" disabled={!data.hasMore || pendingId !== null} onClick={() => { setData(null); setError(false); setPage(page + 1); }} className="rounded-lg border border-[#73aaa3] px-4 py-2 disabled:opacity-40">{t("Next")}</button></nav>}
    </>}
  </section>;
}
