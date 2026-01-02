"use client";

import { useAppSelector } from "@/store/hooks";
import { useState, useEffect, useCallback, useRef } from "react";
import { I18nKey, Language, t } from "@/lib/i18n";
import SpinnerIcon from "@/public/icons/spinner.svg";
import clsx from "clsx";
import { EXPORT_DELAY } from "@/lib/constants";
import { toast } from "react-toastify";
import { selectExportInfo } from "@/store/selectors";
import ExportElems from "./ExportElems";
// @ts-expect-error no typescript for dom-to-image-more
import DomToImage from "dom-to-image-more";
import { embedPlanDataInPng } from "@/lib/export";
import { mapStringfyReplacer } from "@/lib/sync";
import type { ExportModalProps, CommonModalProps } from "@/types/modals";

// export modal for exporting plan as image
const ExportModalContent = ({
  planId,
  closeCb,
}: ExportModalProps & CommonModalProps) => {
  // user language
  const userLang = useAppSelector((state) => state.userData.lang) as Language;
  const { terms, plan, planStats, planCourseData } = useAppSelector((state) =>
    selectExportInfo(state, planId),
  );

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    lang: userLang,
    includePlanStats: true,
    includeCourseTaken: true,
    includeEquivRules: true,
    expandCourses: true,
  });

  const handleChange = (field: string, value: any) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleConfirm = useCallback(() => {
    if (!previewUrl || !plan) return;

    try {
      const planData = JSON.stringify(
        {
          terms,
          plan,
        },
        mapStringfyReplacer,
      );
      const newPreviewUrl = embedPlanDataInPng(previewUrl, planData);

      const link = document.createElement("a");
      link.href = newPreviewUrl;
      link.download = `${plan.name}.png`;
      link.click();
      link.remove();
    } catch (error) {
      toast.error(
        t([I18nKey.FAILED_TO_EXPORT], formState.lang, { item1: String(error) }),
        {
          autoClose: 3000,
          closeButton: false,
        },
      );
    }

    closeCb();
  }, [previewUrl, plan, terms, closeCb, formState.lang]);

  const exportContainerRef = useRef<HTMLDivElement>(null);

  // TODO: debounce this
  const prepareExport = useCallback(async () => {
    setPreviewUrl(null);
    await new Promise((r) => setTimeout(r, EXPORT_DELAY));

    const container = exportContainerRef.current;
    if (!container) return;

    await document.fonts.ready;
    const dataUrl = await DomToImage.toPng(container, {
      quality: 1.0,
      width: container.scrollWidth,
      height: container.scrollHeight,
    });

    setPreviewUrl(dataUrl);
  }, [setPreviewUrl]);

  useEffect(() => {
    if (!planId) return;

    prepareExport().catch((err) => {
      toast.error(
        t([I18nKey.FAILED_TO_EXPORT], formState.lang, { item1: String(err) }),
        {
          autoClose: 3000,
          closeButton: false,
        },
      );
      closeCb();
    });
  }, [planId, closeCb, formState, prepareExport]);

  return (
    <>
      <header>
        <h3>Export Plan</h3>
      </header>

      {planId && plan && (
        <ExportElems // fixed position, now shown to user
          ref={exportContainerRef}
          plan={plan}
          planStats={planStats}
          courseDataPerTerm={planCourseData}
          terms={terms}
          {...formState}
        />
      )}

      <form className="export-options">
        <label htmlFor="includePlanStats">
          <input
            id="includePlanStats"
            type="checkbox"
            name="includePlanStats"
            checked={formState.includePlanStats}
            onChange={(e) => handleChange("includePlanStats", e.target.checked)}
          />
          {t([I18nKey.INCLUDE_PLAN_STATS], userLang)}
        </label>

        <label htmlFor="includeCourseTaken">
          <input
            id="includeCourseTaken"
            type="checkbox"
            name="includeCourseTaken"
            checked={formState.includeCourseTaken}
            onChange={(e) =>
              handleChange("includeCourseTaken", e.target.checked)
            }
          />
          {t([I18nKey.INCLUDE_COURSE_TAKEN], userLang)}
        </label>

        <label htmlFor="includeEquivRules">
          <input
            id="includeEquivRules"
            type="checkbox"
            name="includeEquivRules"
            checked={formState.includeEquivRules}
            onChange={(e) =>
              handleChange("includeEquivRules", e.target.checked)
            }
          />
          {t([I18nKey.INCLUDE_EQUIV_RULES], userLang)}
        </label>

        <label htmlFor="expandCourses">
          <input
            id="expandCourses"
            name="expandCourses"
            type="checkbox"
            checked={formState.expandCourses}
            onChange={(e) => handleChange("expandCourses", e.target.checked)}
          />
          {t([I18nKey.EXPAND_COURSES], userLang)}
        </label>

        <div />

        <div className="lang-options">
          <label htmlFor="langEn">
            <input
              id="langEn"
              type="radio"
              name="lang"
              value={Language.EN}
              checked={formState.lang === Language.EN}
              onChange={() => handleChange("lang", Language.EN)}
            />
            {Language.EN}
          </label>

          <label htmlFor="langFr">
            <input
              id="langFr"
              type="radio"
              name="lang"
              value={Language.FR}
              checked={formState.lang === Language.FR}
              onChange={() => handleChange("lang", Language.FR)}
            />
            {Language.FR}
          </label>
        </div>
      </form>

      {/* preview container */}
      {previewUrl ? (
        <div className="preview-container">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Preview" />
        </div>
      ) : (
        <div className="loading-container">
          <SpinnerIcon className="spinner" />
        </div>
      )}

      {/* footer, includes cancel/confirm buttons */}
      <footer>
        <button className="cancel-button" onClick={closeCb}>
          {t([I18nKey.CANCEL], userLang)}
        </button>

        <button
          className={clsx("confirm-button", !previewUrl && "disabled")}
          onClick={handleConfirm}
          disabled={!previewUrl}
        >
          {t([I18nKey.EXPORT], userLang)}
        </button>
      </footer>
    </>
  );
};

export default ExportModalContent;
