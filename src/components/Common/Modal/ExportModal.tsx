"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearExportPlanId } from "@/store/slices/localDataSlice";
import { useState, useEffect, useCallback, useRef } from "react";
import Modal from "react-modal";
import CloseIcon from "@/public/icons/delete.svg";
import { I18nKey, Language, t } from "@/lib/i18n";
import SpinnerIcon from "@/public/icons/spinner.svg";
import clsx from "clsx";
import { EXPORT_DELAY } from "@/lib/constants";
import { toast } from "react-toastify";
import { selectExportInfo } from "@/store/selectors";
import ExportElems from "./ExportElems";
// @ts-expect-error no typescript for dom-to-image-more
import DomToImage from "dom-to-image-more";

Modal.setAppElement("html");

const ExportModal = () => {
  const userLang = useAppSelector((state) => state.userData.lang) as Language;
  const planId = useAppSelector((state) => state.localData.exportPlanId);
  const dispatch = useAppDispatch();
  const { terms, plan, planStats, planCourseData } = useAppSelector((state) =>
    selectExportInfo(state, planId),
  );

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    lang: userLang,
    includePlanStats: true,
    includeCourseTaken: true,
    expandCourses: true,
  });

  const handleChange = (field: string, value: any) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleClose = useCallback(() => {
    setPreviewUrl(null);
    setFormState({
      lang: userLang,
      includePlanStats: true,
      includeCourseTaken: true,
      expandCourses: true,
    });
    dispatch(clearExportPlanId());
  }, [dispatch, userLang]);

  const handleConfirm = useCallback(() => {
    if (!previewUrl || !plan) return;

    const link = document.createElement("a");
    link.href = previewUrl;
    link.download = `${plan.name}.jpg`;
    link.click();
    link.remove();

    handleClose();
  }, [previewUrl, plan, handleClose]);

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
      handleClose();
    });
  }, [planId, dispatch, handleClose, formState, prepareExport]);

  return (
    <Modal
      isOpen={!!planId}
      shouldCloseOnOverlayClick={true}
      shouldCloseOnEsc={true}
      onRequestClose={handleClose}
      className="export-modal-content"
      overlayClassName="modal-overlay"
      ariaHideApp={false}
    >
      <header>
        <h3>Export Plan</h3>
        <button onClick={handleClose}>
          <CloseIcon />
        </button>
      </header>

      {planId && plan && (
        <ExportElems // fixed position, now shown to user
          ref={exportContainerRef}
          plan={plan}
          lang={formState.lang}
          planStats={planStats}
          courseDataPerTerm={planCourseData}
          terms={terms}
          includePlanStats={formState.includePlanStats}
          includeCourseTaken={formState.includeCourseTaken}
          expandCourses={formState.expandCourses}
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

      <footer>
        <button className="cancel-button" onClick={handleClose}>
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
    </Modal>
  );
};

export default ExportModal;
