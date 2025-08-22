"use client";

import CourseTaken from "../../Course/CourseTaken";
import { I18nKey, t, Language } from "@/lib/i18n";
import { ItemTag } from "..";
import type { Plan, Term } from "@/types/db";
import type { getPlanCourseData, getPlanStats } from "@/lib/plan";
import TermCard from "../../Term/TermCard";
import { forwardRef } from "react";

interface ExportElemsProps {
  plan: Plan;
  lang: Language;
  planStats: ReturnType<typeof getPlanStats>;
  courseDataPerTerm: ReturnType<typeof getPlanCourseData>;
  terms: Term[];
  includePlanStats: boolean;
  includeCourseTaken: boolean;
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
      includePlanStats,
      includeCourseTaken,
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
      totalCourseTakenCretids,
    } = planStats;

    return (
      <div className="export-container" ref={ref}>
        <span className="plan-name">{plan.name}</span>
        <section className="info-container">
          {(includePlanStats || includeCourseTaken) && (
            <div className="optional-container">
              {includePlanStats && (
                <ItemTag
                  items={[
                    `# ${t([I18nKey.COURSE], lang)}s: ${totalCourses} (${totalCredits} cr)`,
                    `# ${t([I18nKey.PLANNED_COURSES], lang)}: ${totalPlannedCourses} (${totalPlanCredits} cr)`,
                    `# ${t([I18nKey.COURSE_TAKEN], lang)}: ${totalCourseTaken} (${totalCourseTakenCretids} cr)`,
                    `# ${t([I18nKey.SEMESTER], lang)}s: ${totalTerm} (${averageCreditsPerTerm} cr/term)`,
                  ]}
                  title={t([I18nKey.PLAN_STATS], lang)}
                  isExport={true}
                  displayLang={lang}
                />
              )}
              {includeCourseTaken && (
                <CourseTaken isExport={true} displayLang={lang} />
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
                isFirst={idx === 0}
                isExport={true}
                isCourseDraggable={false}
                showButtons={false}
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
