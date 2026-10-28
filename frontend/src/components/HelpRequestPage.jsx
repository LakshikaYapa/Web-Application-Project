import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/useLanguage";

const helpTypes = ["Food and drinking water", "Shelter", "Rescue or transport", "Medical assistance", "Other help"];

function PhotoPreview({ file }) {
  const imageRef = useRef(null);
  useEffect(() => {
    const preview = URL.createObjectURL(file);
    imageRef.current.src = preview;
    return () => URL.revokeObjectURL(preview);
  }, [file]);
  return <img ref={imageRef} alt={file.name} />;
}

export default function HelpRequestPage() {
  const { t } = useLanguage();
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState("");

  function selectPhotos(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (photos.length + files.length > 3) {
      setError("Choose up to 3 photos.");
      return;
    }
    if (files.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024)) {
      setError("Use JPG, PNG or WebP images, up to 5 MB each.");
      return;
    }
    setError("");
    setPhotos((current) => [...current, ...files]);
  }

  return (
    <main id="main" className="help-request-page" tabIndex={-1}>
      <a className="help-back" href="/">← {t("Back to homepage")}</a>
      <h1>{t("Request help")}</h1>
      <p>{t("Tell us what support you need and where you are.")}</p>
      <p className="help-preview-note" id="help-preview-note">{t("Form preview only. Requests and photos are not sent or saved yet.")}</p>
      <form className="help-request-form" onSubmit={(event) => event.preventDefault()} aria-describedby="help-preview-note">
        <label htmlFor="help-type">{t("What help do you need?")}</label>
        <select id="help-type" name="helpType" required defaultValue="">
          <option value="" disabled>{t("Select a help type")}</option>
          {helpTypes.map((type) => <option key={type} value={type}>{t(type)}</option>)}
        </select>
        <label htmlFor="help-town">{t("Nearest town")}</label>
        <input id="help-town" name="nearestTown" autoComplete="address-level2" required maxLength={100} />
        <label htmlFor="help-location">{t("Location or nearby landmark")}</label>
        <input id="help-location" name="location" required maxLength={300} />
        <label htmlFor="help-details">{t("Describe your situation")}</label>
        <textarea id="help-details" name="description" rows={5} required maxLength={2000} />
        <label htmlFor="help-photos">{t("Photos (optional)")}</label>
        <p className="help-photo-hint" id="help-photo-hint">{t("Up to 3 photos. JPG, PNG or WebP, maximum 5 MB each.")}</p>
        <input id="help-photos" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={selectPhotos} aria-describedby="help-photo-hint help-photo-error" />
        <p id="help-photo-error" role="alert">{error && t(error)}</p>
        {photos.length > 0 && <ul className="help-photo-list">
          {photos.map((file, index) => <li key={`${file.name}-${index}`}>
            <PhotoPreview file={file} /><span>{file.name}</span>
            <button type="button" aria-label={`${t("Remove photo")}: ${file.name}`} onClick={() => setPhotos((current) => current.filter((_, i) => i !== index))}>{t("Remove photo")}</button>
          </li>)}
        </ul>}
        <button className="register-submit" type="submit" disabled>{t("Send request (coming soon)")}</button>
      </form>
    </main>
  );
}
