import { useEffect, useRef } from "react";
import { useLanguage } from "../i18n/useLanguage";

export default function SignInDialog({ onClose, onRegister }) {
  const { t } = useLanguage();
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <dialog ref={dialogRef} className="register-dialog" aria-labelledby="signin-title" aria-describedby="signin-description" onCancel={onClose}>
      <div className="register-dialog-heading">
        <h2 id="signin-title">{t("Sign in")}</h2>
        <button className="register-close" type="button" onClick={onClose} aria-label={t("Close sign in")}>×</button>
      </div>
      <p className="register-description" id="signin-description">{t("Sign-in is coming soon. You can create an account now.")}</p>
      <fieldset disabled className="register-fields">
        <legend className="sr-only">{t("Account details")}</legend>
        <label htmlFor="signin-email">{t("Email address")}</label>
        <input id="signin-email" type="email" name="email" autoComplete="username" />
        <label htmlFor="signin-password">{t("Password")}</label>
        <input id="signin-password" type="password" name="password" autoComplete="current-password" />
        <button className="register-submit" type="button">{t("Sign in")}</button>
      </fieldset>
      <p className="auth-switch">{t("Don't have an account?")} {" "}<button type="button" onClick={onRegister}>{t("Register")}</button></p>
    </dialog>
  );
}
