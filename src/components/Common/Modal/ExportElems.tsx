"use client";

import CourseTaken from "../../Course/CourseTaken";
import { I18nKey, t, Language } from "@/lib/i18n";
import { ItemTag } from "..";
import type { Plan, Term } from "@/types/db";
import type { getPlanCourseData, getPlanStats } from "@/lib/plan";
import TermCard from "../../Term/TermCard";
import { forwardRef, useCallback, useEffect, useState } from "react";
import EquivRulesTag from "@/components/Layout/UtilityBar/AppActions/EquivRulesTag";
import { exportInfoToQRCodeDataUrl } from "@/lib/export/qrCode";

interface ExportElemsProps {
  plan: Plan;
  lang: Language;
  planStats: ReturnType<typeof getPlanStats>;
  courseDataPerTerm: ReturnType<typeof getPlanCourseData>;
  terms: Term[];
  includeImportQRCode: boolean;
  includePlanStats: boolean;
  includeCourseTaken: boolean;
  includeEquivRules: boolean;
  expandCourses: boolean;
}

const ExportElems = forwardRef<HTMLDivElement, ExportElemsProps>(
  (
    {
      plan,
      lang,
      planStats,
      courseDataPerTerm,
      terms,
      includeImportQRCode,
      includePlanStats,
      includeCourseTaken,
      includeEquivRules,
      expandCourses,
    },
    ref,
  ) => {
    const {
      totalCredits,
      totalCourses,
      totalTerm,
      totalPlannedCourses,
      totalCourseTaken,
      totalPlanCredits,
      averageCreditsPerTerm,
      totalCourseTakenCredits,
    } = planStats;

    const [qrCodeDataUrl, setQRCodeDataUrl] = useState<string | null>(null);

    const prepareQRCode = useCallback(async () => {
      setQRCodeDataUrl(null);
      try {
        const dataUrl = await exportInfoToQRCodeDataUrl(plan, terms);
        setQRCodeDataUrl(dataUrl);
      } catch (error) {
        console.error(error);
      }
    }, [plan, terms]);

    useEffect(() => {
      prepareQRCode();
    }, [plan, terms]);

    const hasOptionalElems =
      includePlanStats || includeCourseTaken || includeEquivRules;

    return (
      <div className="export-container" ref={ref}>
        <span className="plan-name">{plan.name}</span>
        <section className="info-container">
          {hasOptionalElems && (
            <div className="optional-container">
              {includePlanStats && (
                <ItemTag
                  items={[
                    `# ${t([I18nKey.COURSE], lang)}s: ${totalCourses} (${totalCredits} cr)`,
                    `# ${t([I18nKey.PLANNED_COURSES], lang)}: ${totalPlannedCourses} (${totalPlanCredits} cr)`,
                    `# ${t([I18nKey.COURSE_TAKEN], lang)}: ${totalCourseTaken} (${totalCourseTakenCredits} cr)`,
                    `# ${t([I18nKey.SEMESTER], lang)}s: ${totalTerm} (${averageCreditsPerTerm} cr/term)`,
                  ]}
                  title={t([I18nKey.PLAN_STATS], lang)}
                  isExport={true}
                  displayLang={lang}
                />
              )}
              {includeEquivRules && (
                <EquivRulesTag isExport={true} displayLang={lang} />
              )}
              {includeCourseTaken && (
                <CourseTaken isExport={true} displayLang={lang} />
              )}
              {includeImportQRCode && qrCodeDataUrl && (
                <div className="qr-code-container">
                  <img src={qrCodeDataUrl} alt="Import QR Code" />
                </div>
              )}
            </div>
          )}

          <section className="terms-container export">
            {terms.map((term, idx) => (
              <TermCard
                key={term._id}
                planId={plan._id}
                idx={idx}
                term={term}
                courses={courseDataPerTerm[term._id]}
                isExport
                isCourseDraggable={false}
                className="export"
                displayLang={lang}
                expandCourses={expandCourses}
              />
            ))}
          </section>
        </section>
      </div>
    );
  },
);

ExportElems.displayName = "ExportElems";
export default ExportElems;
