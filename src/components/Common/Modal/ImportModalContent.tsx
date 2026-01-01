"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useCallback, useState } from "react";
import CloseIcon from "@/public/icons/delete.svg";
import { t, I18nKey, type Language } from "@/lib/i18n";
import clsx from "clsx";
import SpinnerIcon from "@/public/icons/spinner.svg";
import PlanPreview from "./PlanPreview";
import type { Plan, Term } from "@/types/db";
import { toast } from "react-toastify";
import { parsePlanDataFromPng } from "@/lib/export";
import { isValidImportPlanData } from "@/lib/typeGuards";
import { importPlanData } from "@/store/thunks";
import type { ImportModalProps, CommonModalProps } from "@/types/modals";

const ImportModalContent = ({
  closeCb,
}: ImportModalProps & CommonModalProps) => {
  // dispatch
  const dispatch = useAppDispatch();
  const lang = useAppSelector((state) => state.userData.lang) as Language;

  const [planData, setPlanData] = useState<{
    terms: Term[];
    plan: Plan;
  } | null>(null);
  const [isReadyToImport, setIsReadyToImport] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = useCallback(() => {
    if (!planData || !isReadyToImport) return;

    setIsLoading(true);
    dispatch(importPlanData(planData))
      .then(() => {
        closeCb();
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [dispatch, planData, isReadyToImport, closeCb]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setFile(file);
      setIsLoading(true);

      const reader = new FileReader();

      reader.onload = () => {
        const base64Data = reader.result as string;
        setPreviewURL(base64Data);

        try {
          const planData = parsePlanDataFromPng(base64Data);
          if (!isValidImportPlanData(planData)) {
            throw new Error("Invalid plan data");
          }

          setPlanData(planData);
          setIsReadyToImport(true);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : String(error));
          setFile(null);
          setPreviewURL(null);
        } finally {
          setIsLoading(false);
        }
      };
      reader.onerror = () => {
        toast.error(t([I18nKey.FAILED_TO_IMPORT_PLAN], lang));
        setIsLoading(false);
        setFile(null);
      };
      reader.readAsDataURL(file);

      setIsLoading(false);
    },
    [lang],
  );

  return (
    <>
      {/* header */}
      <header>
        <h3>{t([I18nKey.IMPORT, I18nKey.PLAN], lang)}</h3>
        <button onClick={closeCb}>
          <CloseIcon />
        </button>
      </header>
      {/* plan preview */}
      {planData && <PlanPreview planData={planData} />}

      {/* file input */}
      <label
        htmlFor="import-plan-file"
        className={clsx(
          "file-input-label",
          file && "uploaded",
          isLoading && "disabled",
        )}
      >
        {isLoading ? (
          <div className="loading-container">
            <SpinnerIcon className="spinner" />
          </div>
        ) : (
          <div className="file-input-content">
            {previewURL && <img src={previewURL} alt="Preview" />}
            <span>
              {file
                ? file.name.substring(0, 50) +
                  (file.name.length > 50 ? "..." : "")
                : t([I18nKey.UPLOAD_IMAGE], lang)}
            </span>
          </div>
        )}
      </label>
      <input
        disabled={isLoading}
        id="import-plan-file"
        type="file"
        accept=".png"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* description */}
      <section className="description">
        <p>{t([I18nKey.IMPORT_PLAN_DESC], lang)}</p>
      </section>

      {/* footer, includes cancel/confirm buttons */}
      <footer>
        <button className="cancel-button" onClick={closeCb}>
          {t([I18nKey.CANCEL], lang)}
        </button>

        <button
          className={clsx("confirm-button", !isReadyToImport && "disabled")}
          disabled={!file}
          onClick={handleConfirm}
        >
          {t([I18nKey.IMPORT], lang)}
        </button>
      </footer>
    </>
  );
};

export default ImportModalContent;
