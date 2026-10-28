import { useEffect, useState } from "react";
import { useLanguage } from "../i18n/useLanguage";

function RequestPhoto({ requestId, index }) {
  const { t } = useLanguage();
  const [failed, setFailed] = useState(false);
  const source = `/api/help-requests/${encodeURIComponent(requestId)}/photos/${index}`;
  return <li>
    {failed ? <p role="status">{t("Unable to load this photo. Refresh the list to try again.")}</p> : <a href={source} target="_blank" rel="noopener noreferrer" aria-label={`${t("Open photo")} ${index + 1}`}>
      <img src={source} alt={`${t("Request photo")} ${index + 1}`} loading="lazy" onError={() => setFailed(true)} />
    </a>}
  </li>;
}

export default function MyHelpRequests() {
  const { t, language } = useLanguage();
  const requestedPage = Number(new URLSearchParams(window.location.search).get("page") || 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 && requestedPage <= 100000 ? requestedPage : 1;
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/help-requests/mine?page=${page}`, {
      credentials: "same-origin", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]),
    }).then(async (response) => {
      if (response.status === 401) throw new Error("Please sign in using the page header, then refresh this list.");
      if (!response.ok) throw new Error("Unable to load your requests. Please try again.");
      const body = await response.json();
      if (!body.success || !Array.isArray(body.requests)) throw new Error("Unable to load your requests. Please try again.");
      if (!controller.signal.aborted) setResult(body);
    }).catch((failure) => {
      if (!controller.signal.aborted) setError(failure.message === "Please sign in using the page header, then refresh this list." ? failure.message : "Unable to load your requests. Please try again.");
    });
    return () => controller.abort();
  }, [page]);

  return <main id="main" className="help-request-page" tabIndex={-1}>
    <a className="help-back" href="/">{t("Back to homepage")}</a>
    <div className="my-requests-heading"><h1>{t("My help requests")}</h1><a className="help-back" href="/request-help">{t("Request help")}</a></div>
    <p>{t("Your requests, newest first.")}</p>
    <button type="button" className="my-requests-refresh" onClick={() => window.location.reload()}>{t("Refresh list")}</button>
    {error ? <p className="help-preview-note" role="alert">{t(error)}</p> : !result ? <p role="status">{t("Loading your requests…")}</p> : <>
      {!result.requests.length && <p className="help-preview-note" role="status">{t(page === 1 ? "You have not sent any help requests yet." : "No requests on this page.")}</p>}
      <ul className="my-requests-list">{result.requests.map((request) => <li className="my-request-card" key={request.id}>
        <div className="my-requests-heading"><h2>{t(request.helpType)}</h2><span className="my-request-status">{t(request.status === "pending" ? "Pending" : request.status)}</span></div>
        <p><strong>{t("Nearest town")}:</strong> {request.nearestTown}</p>
        {request.phone && <p><strong>{t("Phone number")}:</strong> {request.phone}</p>}
        {request.otherHelp && <p><strong>{t("What other help do you need?")}:</strong> {request.otherHelp}</p>}
        <p><strong>{t("Location or nearby landmark")}:</strong> {request.location}</p>
        <p className="my-request-description">{request.description}</p>
        <p>{t("Sent on")}: <time dateTime={request.createdAt}>{new Date(request.createdAt).toLocaleString(language === "si" ? "si-LK" : "en-LK")}</time></p>
        <p className="my-request-reference">{t("Request reference")}: {request.id}</p>
        {request.photoCount > 0 && <div>
          <h3>{t("Attached photos")}</h3>
          <ul className="my-request-photos">{Array.from({ length: Math.min(request.photoCount, 3) }, (_, index) => <RequestPhoto key={index} requestId={request.id} index={index} />)}</ul>
        </div>}
      </li>)}</ul>
      <nav className="my-requests-heading" aria-label={t("Request list pages")}>
        {page > 1 && <a className="help-back" href={`/my-requests?page=${page - 1}`}>{t("Previous page")}</a>}
        {result.hasMore && <a className="help-back" href={`/my-requests?page=${page + 1}`}>{t("Next page")}</a>}
      </nav>
    </>}
  </main>;
}
