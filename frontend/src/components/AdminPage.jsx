import { useEffect, useState } from "react";

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("Checking administrator access…");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/admin", { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) throw new Error("Please sign in with your administrator account.");
        if (response.status === 403) throw new Error("This page is available to administrators only.");
        if (!response.ok) throw new Error("Unable to check access. Please reload and try again.");
        const body = await response.json();
        setUser(body.user);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setMessage(error.message);
      });
    return () => controller.abort();
  }, []);

  async function logout() {
    setPending(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST", headers: { "X-CSRF-Protection": "1" },
      });
      if (!response.ok) throw new Error();
      window.location.assign("/");
    } catch {
      setMessage("Unable to sign out. Please try again.");
      setPending(false);
    }
  }

  return (
    <main id="main" className="admin-page" tabIndex={-1}>
      {!user ? <section className="admin-panel"><h1>Admin access</h1><p role="status">{message}</p><a href="/">Back to homepage</a></section> : (
        <>
          <div className="admin-heading"><div><p className="admin-eyebrow">FLOODGUARD ADMINISTRATION</p><h1>Admin dashboard</h1><p>Welcome, {user.name}.</p></div><button className="register-submit" onClick={logout} disabled={pending}>{pending ? "Signing out…" : "Sign out"}</button></div>
          <section className="admin-panel"><h2>Administrator account</h2><p>{user.email}</p><p>You have administrator access to FloodGuard.</p></section>
          <section className="admin-panel"><h2>Next steps</h2><p>User management, shelter management and flood report review will be added in upcoming steps.</p></section>
          {pending === false && message.startsWith("Unable to sign out") && <p role="alert">{message}</p>}
        </>
      )}
    </main>
  );
}
