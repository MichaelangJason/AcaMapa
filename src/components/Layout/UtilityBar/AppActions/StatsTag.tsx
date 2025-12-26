"use client";
import { ItemTag } from "@/components/Common";
import { TooltipId } from "@/lib/enums";
import { t, I18nKey, Language } from "@/lib/i18n";
import { useAppSelector } from "@/store/hooks";
import { selectPlanStats } from "@/store/selectors";

const StatsTag = () => {
  const currentPlanId = useAppSelector(
    (state) => state.localData.currentPlanId,
  );
  // plan stats
  const {
    totalCredits,
    totalCourses,
    totalPlannedCourses,
    totalCourseTaken,
    totalPlanCredits,
    totalCourseTakenCretids,
    totalTerm,
    averageCreditsPerTerm,
  } = useAppSelector((state) => selectPlanStats(state, currentPlanId));
  const lang = useAppSelector((state) => state.userData.lang) as Language;

  return (
    <ItemTag
      items={[
        `# ${t([I18nKey.COURSE], lang)}s: ${totalCourses} (${totalCredits} cr)`,
        `# ${t([I18nKey.PLANNED_COURSES], lang)}: ${totalPlannedCourses} (${totalPlanCredits} cr)`,
        `# ${t([I18nKey.COURSE_TAKEN], lang)}: ${totalCourseTaken} (${totalCourseTakenCretids} cr)`,
        `# ${t([I18nKey.SEMESTER], lang)}s: ${totalTerm} (${averageCreditsPerTerm} cr/term)`,
      ]}
      title={t([I18nKey.PLAN_STATS], lang)}
      tooltipProps={{
        "data-tooltip-id": TooltipId.ITEM_TAG,
        "data-tooltip-place": "right",
      }}
      isPinnable
    />
  );
};

export default StatsTag;
