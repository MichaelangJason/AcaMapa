"use client";
import { ItemTag } from "@/components/Common";
import { TooltipId } from "@/lib/enums";
import { t, I18nKey, Language } from "@/lib/i18n";
import { useAppSelector } from "@/store/hooks";
import { selectPlanStats } from "@/store/selectors";

const StatsTag = ({
  ref,
}: {
  ref?: React.RefObject<HTMLDivElement | null>;
}) => {
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
    totalCourseTakenCredits,
    totalTerm,
    averageCreditsPerTerm,
  } = useAppSelector((state) => selectPlanStats(state, currentPlanId));
  const lang = useAppSelector((state) => state.userData.lang) as Language;

  return (
    <ItemTag
      ref={ref}
      items={[
        `# ${t([I18nKey.COURSE], lang)}s: ${totalCourses} (${totalCredits} cr)`,
        `# ${t([I18nKey.PLANNED_COURSES], lang)}: ${totalPlannedCourses} (${totalPlanCredits} cr)`,
        `# ${t([I18nKey.COURSE_TAKEN], lang)}: ${totalCourseTaken} (${totalCourseTakenCredits} cr)`,
        `# ${t([I18nKey.SEMESTER], lang)}s: ${totalTerm} (${averageCreditsPerTerm} cr/term)`,
      ]}
      title={t([I18nKey.PLAN_STATS], lang)}
      tooltipProps={{
        "data-tooltip-id": TooltipId.ITEM_TAG,
        "data-tooltip-place": "right",
      }}
      pinnable
    />
  );
};

export default StatsTag;
