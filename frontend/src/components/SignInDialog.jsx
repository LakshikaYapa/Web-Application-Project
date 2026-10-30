import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/useLanguage";
import AuthIntro from "./AuthIntro";

export default function SignInDialog({ onClose, onRegister, onSignedIn }) {
  const { t } = useLanguage();
  const dialogRef = useRef(null);
  const requestRef = useRef(null);
  const pendingRef = useRef(false);
  const feedbackRef = useRef(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      requestRef.current?.abort();
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (message || signedIn) feedbackRef.current?.focus();
  }, [message, signedIn]);

  async function submit(event) {
    event.preventDefault();
    if (pendingRef.current) return;
    setMessage("");
    if (email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || !password.length || [...password].length > 128) {
      setMessage("Enter a valid email address and password.");
      return;
    }
    pendingRef.current = true;
    setPending(true);
    const controller = new AbortController();
    requestRef.current = controller;
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", "X-CSRF-Protection": "1" },
        body: JSON.stringify({ email: email.trim(), password }),
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]),
      });
      const body = await response.json().catch(() => ({}));
      if (response.ok && body.success) {
        setPassword("");
        onSignedIn?.(body.user);
        if (body.user?.roles?.includes("admin")) {
          window.location.assign("/admin");
          return;
        }
        setSignedIn(true);
      } else {
        const messages = {
          INVALID_CREDENTIALS: "Email or password is incorrect.",
          RATE_LIMITED: "Too many sign-in attempts. Try again later.",
          VALIDATION_ERROR: "Enter a valid email address and password.",
        };
        setMessage(messages[body.code] ?? "Unable to sign in. Please try again.");
      }
    } catch (error) {
      if (!controller.signal.aborted && error.name !== "AbortError") setMessage("Cannot connect to the server. Please try again.");
    } finally {
      pendingRef.current = false;
      if (!controller.signal.aborted) setPending(false);
    }
  }

  return (
    <dialog ref={dialogRef} className="register-dialog auth-dialog signin-dialog" aria-labelledby="signin-title" aria-describedby="signin-description" onCancel={onClose}>
      <div className="auth-layout">
      <AuthIntro />
      <div className="auth-panel">
      <div className="register-dialog-heading">
        <h2 id="signin-title">{t("Sign in")}</h2>
        <button className="register-close" type="button" onClick={onClose} aria-label={t("Close sign in")}>×</button>
      </div>
      <p className="register-description" id="signin-description">{t("Welcome back. Sign in to your FloodGuard account.")}</p>
      {signedIn ? (
        <div className="register-success" role="status" ref={feedbackRef} tabIndex={-1}>
          <h3>{t("You are signed in")}</h3>
          <p>{t("Your sign-in was successful.")}</p>
          <button className="register-submit" type="button" onClick={onClose}>{t("Done")}</button>
        </div>
      ) : (
      <form onSubmit={submit} noValidate aria-busy={pending}>
      {message && <p className="register-error-summary" role="alert" ref={feedbackRef} tabIndex={-1} id="signin-error">{t(message)}</p>}
      <fieldset disabled={pending} className="register-fields">
        <legend className="sr-only">{t("Account details")}</legend>
        <label htmlFor="signin-email">{t("Email address")}</label>
        <input id="signin-email" type="email" name="email" autoComplete="username" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} aria-describedby={message ? "signin-error" : undefined} />
        <label htmlFor="signin-password">{t("Password")}</label>
        <input id="signin-password" type="password" name="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} aria-describedby={message ? "signin-error" : undefined} />
        <button className="register-submit" type="submit">{t(pending ? "Signing in…" : "Sign in")}</button>
      </fieldset>
      </form>
      )}
      {!signedIn &&
      <p className="auth-switch">{t("Don't have an account?")} {" "}<button type="button" onClick={onRegister}>{t("Register")}</button></p>
      }
      </div>
      </div>
    </dialog>
  );
}
