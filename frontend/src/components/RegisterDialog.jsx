import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/useLanguage";

const roleOptions = [
  { value: "volunteer", label: "Volunteer" },
  { value: "help_seeker", label: "Help seeker" },
  { value: "funder", label: "Funder" },
];

const apiMessages = {
  EMAIL_IN_USE: "An account already uses this email address.",
  RATE_LIMITED: "Too many registration attempts. Try again later.",
};

export default function RegisterDialog({ onClose }) {
  const { t, language } = useLanguage();
  const dialogRef = useRef(null);
  const requestRef = useRef(null);
  const pendingRef = useRef(false);
  const summaryRef = useRef(null);
  const [values, setValues] = useState({ name: "", email: "", password: "", role: "" });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [created, setCreated] = useState(false);

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
    if (message || Object.keys(errors).length || created) summaryRef.current?.focus();
  }, [message, errors, created]);

  function update(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    if (pendingRef.current) return;
    const nextErrors = {};
    if (values.name.trim().length < 2 || values.name.trim().length > 100) nextErrors.name = "Name must contain 2 to 100 characters.";
    if (values.email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) nextErrors.email = "Enter a valid email address.";
    if ([...values.password].length < 15 || [...values.password].length > 128) nextErrors.password = "Password must contain 15 to 128 characters.";
    if (!roleOptions.some(({ value }) => value === values.role)) nextErrors.role = "Choose how you want to participate.";
    setMessage("");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    pendingRef.current = true;
    setPending(true);
    const controller = new AbortController();
    requestRef.current = controller;
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, preferredLanguage: language }),
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]),
      });
      const body = await response.json().catch(() => ({}));
      if (response.status === 201 && body.success) {
        setValues({ name: "", email: "", password: "", role: "" });
        setCreated(true);
      } else if (response.status === 400 && body.code === "VALIDATION_ERROR") {
        // Translate known server messages, rather than rendering arbitrary errors.
        const allowed = new Set([
          "Name must contain 2 to 100 characters.", "Enter a valid email address.",
          "Password must contain 15 to 128 characters.", "Choose volunteer, help_seeker or funder.",
        ]);
        const fieldErrors = Object.fromEntries(Object.entries(body.errors ?? {})
          .filter(([field, text]) => Object.hasOwn(values, field) && allowed.has(text)));
        setErrors(fieldErrors);
        setMessage("Please check the form and try again.");
      } else {
        setMessage(apiMessages[body.code] ?? "Unable to create your account. Please try again.");
      }
    } catch (error) {
      if (error.name !== "AbortError") setMessage("Cannot connect to the server. Please try again.");
    } finally {
      pendingRef.current = false;
      if (!controller.signal.aborted) setPending(false);
    }
  }

  const fieldError = (field) => errors[field] ? <p className="register-field-error" id={`register-${field}-error`}>{t(errors[field])}</p> : null;

  return (
    <dialog ref={dialogRef} className="register-dialog" aria-labelledby="register-title" aria-describedby="register-description" onCancel={onClose}>
      <div className="register-dialog-heading">
        <h2 id="register-title">{t("Create your account")}</h2>
        <button className="register-close" type="button" onClick={onClose} aria-label={t("Close registration")}>×</button>
      </div>
      <p id="register-description" className="register-description">{t("Join FloodGuard to support your community or request help.")}</p>
      {created ? (
        <div className="register-success" ref={summaryRef} tabIndex={-1} role="status">
          <h3>{t("Account created")}</h3>
          <p>{t("Your account has been saved. You are not signed in yet. Sign-in is coming next.")}</p>
          <button className="register-submit" type="button" onClick={onClose}>{t("Done")}</button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate aria-busy={pending}>
          {(message || Object.keys(errors).length > 0) && <p className="register-error-summary" role="alert" ref={summaryRef} tabIndex={-1}>{t(message || "Please check the form and try again.")}</p>}
          <fieldset disabled={pending} className="register-fields">
            <legend className="sr-only">{t("Account details")}</legend>
            <label htmlFor="register-name">{t("Full name")}</label>
            <input id="register-name" name="name" autoComplete="name" value={values.name} onChange={update} required maxLength={100} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "register-name-error" : undefined} />
            {fieldError("name")}
            <label htmlFor="register-email">{t("Email address")}</label>
            <input id="register-email" name="email" type="email" autoComplete="email" value={values.email} onChange={update} required maxLength={254} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "register-email-error" : undefined} />
            {fieldError("email")}
            <label htmlFor="register-password">{t("Password")}</label>
            <input id="register-password" name="password" type="password" autoComplete="new-password" value={values.password} onChange={update} required aria-invalid={Boolean(errors.password)} aria-describedby={`register-password-hint${errors.password ? " register-password-error" : ""}`} />
            <p className="register-hint" id="register-password-hint">{t("Use a unique passphrase of 15 to 128 characters.")}</p>
            {fieldError("password")}
            <label htmlFor="register-role">{t("I want to join as")}</label>
            <select id="register-role" name="role" value={values.role} onChange={update} required aria-invalid={Boolean(errors.role)} aria-describedby={errors.role ? "register-role-error" : undefined}>
              <option value="">{t("Choose a role")}</option>
              {roleOptions.map(({ value, label }) => <option value={value} key={value}>{t(label)}</option>)}
            </select>
            {fieldError("role")}
            <button className="register-submit" type="submit">{t(pending ? "Creating account…" : "Create account")}</button>
          </fieldset>
        </form>
      )}
    </dialog>
  );
}
