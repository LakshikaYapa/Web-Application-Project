import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/useLanguage";

export default function ApprovedHelpRequests({ compact = false }) {
  const { t, language } = useLanguage();
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(false);
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
    const controller = new AbortController();
    let timer;
    async function load() {
      try {
        const response = await fetch(`/api/help-requests?page=${page}`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]) });
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
      const response = await fetch(`/api/help-requests/${request.id}/claim`, { method: "POST", headers: { "X-CSRF-Protection": "1" }, signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]) });
      if (controller.signal.aborted) return;
      if (response.ok) {
        setData((current) => current ? { ...current, requests: current.requests.map((item) => item.id === request.id ? { ...item, claimed: true } : item) } : current);
        setNotice("You have taken responsibility for this help request.");
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

  return <section id="approved-help-requests" aria-labelledby="approved-help-title" className="my-10 scroll-mt-6 rounded-[28px] border border-[#79b5af] bg-[#edf6f4] p-6 min-[761px]:p-9 dark:border-[#4b817b] dark:bg-[#102f34]">
    <div className="flex flex-wrap justify-between gap-5"><div><p className="mb-3 text-xs font-bold tracking-widest text-[#007e8d] uppercase dark:text-[#99e4c9]">{!compact && <>01 &#183; </>}{t("Support your community")}</p><h2 id="approved-help-title" className="text-3xl font-bold">{t("People who need your help")}</h2><p className="mt-3 max-w-2xl text-sm leading-7">{t("Volunteers and donors can take a request. Everyone can see whether someone has already taken it.")}</p></div><div className="flex flex-wrap items-start gap-3"><a href={compact ? "/request-help#submit-help-request" : "#submit-help-request"} className="rounded-xl bg-[#007e8d] px-4 py-3 font-bold text-white hover:bg-[#005e6b]">{t("Request help")} &darr;</a><button type="button" onClick={refresh} className="self-start rounded-xl border border-[#73aaa3] px-4 py-3 font-semibold">{t("Refresh list")}</button></div></div>
    {message && <p role="alert" className="mt-5 rounded-xl border border-red-400 bg-red-50 p-4 text-red-900">{t(message)}</p>}
    {notice && <p role="status" className="mt-5 rounded-xl border border-[#73aaa3] p-4">{t(notice)}</p>}
    {error ? <p role="alert" className="mt-6">{t("Unable to load help requests. Please refresh the list.")}</p> : !data ? <p role="status" className="mt-6">{t("Loading requests…")}</p> : <>
      {!data.requests.length && <p className="mt-6 rounded-2xl border border-[#9cc6bc] bg-[#d8ebe2] p-6 dark:bg-[#1b423b]">{t("No approved help requests yet.")}</p>}
      <ul className="mt-6 grid list-none gap-5 p-0 min-[761px]:grid-cols-2">{(expanded && !compact ? data.requests : data.requests.slice(0, compact ? 2 : 4)).map((request) => <li key={request.id} className="min-w-0 rounded-2xl border border-[#9cc6bc] bg-white p-6 shadow-sm dark:border-[#416f68] dark:bg-[#1b423b]">
        <div className="flex flex-wrap justify-between gap-3"><h3 className="text-xl font-bold">{t(request.helpType)}</h3><span className={`rounded-full px-3 py-1 text-sm font-semibold ${request.claimed ? "bg-[#cce6db] text-[#005849]" : "bg-[#f4d5bd] text-[#773f14]"}`}>{t(request.claimed ? "Already taken" : "Not taken yet")}</span></div>
        <p className="mt-3 font-semibold">{request.nearestTown}</p><p className="mt-2 wrap-break-word text-sm leading-7">{request.location}</p><p className="mt-2 text-sm">{new Intl.DateTimeFormat(language === "si" ? "si-LK" : "en-LK", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Colombo" }).format(new Date(request.createdAt))}</p>
        {request.otherHelp && <p className="mt-4 whitespace-pre-wrap wrap-break-word font-semibold">{request.otherHelp}</p>}<p className="mt-4 whitespace-pre-wrap wrap-break-word leading-7">{request.description}</p>
        {request.photoCount > 0 && <div className="mt-5 flex flex-wrap gap-3">{Array.from({ length: request.photoCount }, (_, index) => <a key={index} href={`/api/help-requests/public/${request.id}/photos/${index}`} target="_blank" rel="noopener noreferrer"><img src={`/api/help-requests/public/${request.id}/photos/${index}`} loading="lazy" alt={`${t("Request photo")} ${index + 1}`} className="h-24 w-28 rounded-lg border border-[#73aaa3] object-cover" /></a>)}</div>}
        <button type="button" disabled={request.claimed || pendingId !== null} onClick={() => claim(request)} className="mt-5 rounded-xl bg-[#007e8d] px-5 py-3 font-bold text-white enabled:hover:bg-[#005e6b] disabled:cursor-not-allowed disabled:opacity-50">{t(request.claimed ? "Already taken" : pendingId === request.id ? "Taking request…" : "Take this request")}</button>
      </li>)}</ul>
      {compact && <div className="mt-7 text-center"><a href="/request-help#approved-help-requests" className="inline-block rounded-xl border border-[#73aaa3] px-7 py-3 font-bold hover:bg-[#d8ebe2] dark:hover:bg-[#1b423b]">{t("See more")} &rarr;</a></div>}
      {!compact && !expanded && (data.requests.length > 4 || data.hasMore) && <div className="mt-7 text-center"><button type="button" aria-expanded={expanded} onClick={() => setExpanded(true)} className="rounded-xl border border-[#73aaa3] bg-white px-7 py-3 font-bold text-[#006b79] hover:bg-[#d8ebe2] dark:bg-[#1b423b] dark:text-[#99e4c9]">{t("See more")} &darr;</button></div>}
      {!compact && expanded && (page > 1 || data.hasMore) && <nav aria-label={t("Help request pages")} className="mt-6 flex items-center gap-4"><button type="button" disabled={page === 1 || pendingId !== null} onClick={() => { setData(null); setError(false); setPage(page - 1); }} className="rounded-lg border border-[#73aaa3] px-4 py-2 disabled:opacity-40">{t("Previous")}</button><span>{t("Page")} {page}</span><button type="button" disabled={!data.hasMore || pendingId !== null} onClick={() => { setData(null); setError(false); setPage(page + 1); }} className="rounded-lg border border-[#73aaa3] px-4 py-2 disabled:opacity-40">{t("Next")}</button></nav>}
    </>}
  </section>;
}
