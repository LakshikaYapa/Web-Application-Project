import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/useLanguage";
import AuthIntro from "./AuthIntro";

const emptyValues = { name: "", email: "", password: "", roles: [], address: "", nearestTown: "", phone: "" };
const profileFields = [
  { name: "name", label: "Full name", autoComplete: "name", maxLength: 100 },
  { name: "email", label: "Email address", type: "email", autoComplete: "email", maxLength: 254 },
  { name: "phone", label: "Phone number", type: "tel", autoComplete: "tel", maxLength: 30, hint: "Use 077 123 4567 or +94 77 123 4567." },
  { name: "nearestTown", label: "Nearest town", autoComplete: "address-level2", maxLength: 100 },
  { name: "address", label: "Address", autoComplete: "street-address", maxLength: 300 },
];

const roleOptions = [
  { value: "volunteer", label: "Volunteer" },
  { value: "help_seeker", label: "Help seeker" },
  { value: "funder", label: "Funder" },
];

const apiMessages = {
  EMAIL_IN_USE: "An account already uses this email address.",
  RATE_LIMITED: "Too many registration attempts. Try again later.",
};

export default function RegisterDialog({ onClose, onSignIn }) {
  const { t, language } = useLanguage();
  const dialogRef = useRef(null);
  const requestRef = useRef(null);
  const pendingRef = useRef(false);
  const summaryRef = useRef(null);
  const [values, setValues] = useState(emptyValues);
  const [showPassword, setShowPassword] = useState(false);
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

  function toggleRole(role) {
    setValues((current) => ({
      ...current,
      roles: current.roles.includes(role) ? current.roles.filter((value) => value !== role) : [...current.roles, role],
    }));
  }

  async function submit(event) {
    event.preventDefault();
    if (pendingRef.current) return;
    const nextErrors = {};
    if (values.name.trim().length < 2 || values.name.trim().length > 100) nextErrors.name = "Name must contain 2 to 100 characters.";
    if (values.email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) nextErrors.email = "Enter a valid email address.";
    if ([...values.password].length < 15 || [...values.password].length > 128) nextErrors.password = "Password must contain 15 to 128 characters.";
    if (!values.roles.length) nextErrors.roles = "Select at least one role.";
    if (values.address.trim().length < 5 || values.address.trim().length > 300) nextErrors.address = "Address must contain 5 to 300 characters.";
    if (values.nearestTown.trim().length < 2 || values.nearestTown.trim().length > 100) nextErrors.nearestTown = "Nearest town must contain 2 to 100 characters.";
    if (!/^(?:0[1-9]\d{8}|\+94[1-9]\d{8})$/.test(values.phone.replace(/[\s()-]/g, ""))) nextErrors.phone = "Enter a valid Sri Lankan phone number.";
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
        setValues(emptyValues);
        setShowPassword(false);
        setCreated(true);
      } else if (response.status === 400 && body.code === "VALIDATION_ERROR") {
        // Translate known server messages, rather than rendering arbitrary errors.
        const allowed = new Set([
          "Name must contain 2 to 100 characters.", "Enter a valid email address.",
          "Password must contain 15 to 128 characters.", "Choose one or more distinct roles: volunteer, help_seeker or funder.",
          "Address must contain 5 to 300 characters.", "Nearest town must contain 2 to 100 characters.",
          "Enter a valid Sri Lankan phone number.",
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
    <dialog ref={dialogRef} className="register-dialog auth-dialog registration-dialog" aria-labelledby="register-title" aria-describedby="register-description" onCancel={onClose}>
      <div className="auth-layout">
      <AuthIntro />
      <div className="auth-panel">
      <div className="register-dialog-heading">
        <h2 id="register-title">{t("Create your account")}</h2>
        <button className="register-close" type="button" onClick={onClose} aria-label={t("Close registration")}>×</button>
      </div>
      <p id="register-description" className="register-description">{t("Join FloodGuard to support your community or request help.")}</p>
      {created ? (
        <div className="register-success" ref={summaryRef} tabIndex={-1} role="status">
          <h3>{t("Account created")}</h3>
          <p>{t("Your account has been saved. You can now sign in.")}</p>
          <button className="register-submit" type="button" onClick={onClose}>{t("Done")}</button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate aria-busy={pending}>
          {(message || Object.keys(errors).length > 0) && <p className="register-error-summary" role="alert" ref={summaryRef} tabIndex={-1}>{t(message || "Please check the form and try again.")}</p>}
          <fieldset disabled={pending} className="register-fields register-form-grid">
            <legend className="sr-only">{t("Account details")}</legend>
            {profileFields.map(({ name, label, type = "text", autoComplete, maxLength, hint }) => (
              <div className={`auth-field ${name === "address" ? "auth-field-wide" : ""}`} key={name}>
                <label htmlFor={`register-${name}`}>{t(label)}</label>
                {name === "address" ? (
                  <textarea id={`register-${name}`} name={name} autoComplete={autoComplete} value={values[name]} onChange={update} required maxLength={maxLength} rows={2} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `register-${name}-error` : undefined} />
                ) : (
                  <input id={`register-${name}`} name={name} type={type} autoComplete={autoComplete} value={values[name]} onChange={update} required maxLength={maxLength} aria-invalid={Boolean(errors[name])} aria-describedby={[hint ? `register-${name}-hint` : "", errors[name] ? `register-${name}-error` : ""].filter(Boolean).join(" ") || undefined} />
                )}
                {hint && <p className="register-hint" id={`register-${name}-hint`}>{t(hint)}</p>}
                {fieldError(name)}
              </div>
            ))}
            <div className="auth-field">
            <label htmlFor="register-password">{t("Password")}</label>
            <div className="auth-password-control">
              <input id="register-password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={values.password} onChange={update} required aria-invalid={Boolean(errors.password)} aria-describedby={`register-password-hint${errors.password ? " register-password-error" : ""}`} />
              <button type="button" aria-pressed={showPassword} aria-controls="register-password" onClick={() => setShowPassword((visible) => !visible)}>{t(showPassword ? "Hide" : "Show")}</button>
            </div>
            <p className="register-hint" id="register-password-hint">{t("Use a unique passphrase of 15 to 128 characters.")}</p>
            {fieldError("password")}
            </div>
            <fieldset className="auth-role-group" aria-describedby={`register-roles-hint${errors.roles ? " register-roles-error" : ""}`} aria-invalid={Boolean(errors.roles)}>
              <legend>{t("I want to join as")}</legend>
              <p id="register-roles-hint" className="register-hint">{t("Select one or more roles.")}</p>
              <div className="auth-role-options">
                {roleOptions.map(({ value, label }) => (
                  <label className={`auth-role-option${values.roles.includes(value) ? " is-selected" : ""}`} key={value}>
                    <input type="checkbox" name="roles" value={value} checked={values.roles.includes(value)} onChange={() => toggleRole(value)} />
                    <span>{t(label)}</span>
                  </label>
                ))}
              </div>
              {fieldError("roles")}
            </fieldset>
            <p className="auth-contact-note auth-field-wide">{t("Your phone number and address are not shown on the public homepage.")}</p>
            <button className="register-submit" type="submit">{t(pending ? "Creating account…" : "Create account")}</button>
          </fieldset>
        </form>
      )}
      <p className="auth-switch">{t("Already have an account?")} {" "}<button type="button" onClick={onSignIn}>{t("Sign in")}</button></p>
      </div>
      </div>
    </dialog>
  );
}
