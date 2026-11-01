import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/useLanguage";

function PhotoPreview({ file, onRemove }) {
  const { t } = useLanguage();
  const imageRef = useRef(null);

  useEffect(() => {
    const preview = URL.createObjectURL(file);
    imageRef.current.src = preview;
    return () => URL.revokeObjectURL(preview);
  }, [file]);

  return (
    <li className="overflow-hidden rounded-xl border border-[#73aaa3] bg-white dark:border-[#578e83] dark:bg-[#12343d]">
      <img ref={imageRef} alt={file.name} className="h-40 w-full object-cover" />
      <div className="p-3">
        <p className="truncate text-sm" title={file.name}>{file.name}</p>
        <button type="button" onClick={onRemove} aria-label={`${t("Remove photo")}: ${file.name}`} className="mt-2 rounded-lg border border-[#73aaa3] px-3 py-2 text-sm font-semibold hover:bg-[#d4eae3] focus-visible:outline-2 focus-visible:outline-offset-2 dark:hover:bg-[#285c58]">{t("Remove photo")}</button>
      </div>
    </li>
  );
}

export default function FloodReportPhotos({ photos, setPhotos }) {
  const { t } = useLanguage();
  const [error, setError] = useState("");

  function addPhotos(event) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!selected.length) return;
    if (photos.length + selected.length > 3) {
      setError("Choose up to 3 photos.");
      return;
    }
    if (selected.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size === 0 || file.size > 5 * 1024 * 1024)) {
      setError("Use JPG, PNG or WebP images, up to 5 MB each.");
      return;
    }
    setPhotos((previous) => [...previous, ...selected]);
    setError("");
  }

  return (
    <fieldset className="mt-8 border-t border-[#79b5af] pt-6 dark:border-[#4b817b]">
      <legend className="text-lg font-bold">{t("Photos (optional)")}</legend>
      <p id="report-photos-hint" className="mb-4 text-sm leading-6">{t("Up to 3 photos. JPG, PNG or WebP, maximum 5 MB each.")}</p>
      <label className="relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[#579c98] bg-[#edf7f6] p-6 text-center has-focus-visible:ring-2 has-focus-visible:ring-[#007e8d] dark:bg-[#12343d]">
        <svg className="h-8 w-8 text-[#007e8d] dark:text-[#99e4c9]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5" /></svg>
        <span className="font-semibold">{t("Add report photos")}</span>
        <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={addPhotos} aria-describedby="report-photos-hint" aria-invalid={Boolean(error)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
      </label>
      {error && <p role="alert" className="mt-3 rounded-lg border border-red-400 bg-red-50 p-3 text-red-800 dark:bg-red-950 dark:text-red-200">{t(error)}</p>}
      <ul className="mt-4 grid list-none gap-4 p-0 min-[600px]:grid-cols-3">
        {photos.map((file, index) => <PhotoPreview key={`${file.name}-${file.lastModified}-${index}`} file={file} onRemove={() => { setPhotos((previous) => previous.filter((_, position) => position !== index)); setError(""); }} />)}
      </ul>
    </fieldset>
  );
}
