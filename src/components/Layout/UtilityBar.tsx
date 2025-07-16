import HamburgerIcon from "@/public/icons/hamburger.svg";
import GithubMark from "@/public/icons/github-mark.svg";
import { ItemTag } from "../Common";
import { useSelector } from "react-redux";
import { selectPlanStats } from "@/store/selectors";

const UtilityBar = () => {
  const {
    totalCredits,
    totalCourses,
    totalPlannedCourses,
    totalCourseTaken,
    totalPlanCredits,
    totalCourseTakenCretids,
    totalTerm,
    averageCreditsPerTerm,
  } = useSelector(selectPlanStats);

  return (
    <section className="utility-bar">
      <HamburgerIcon className="hamburger" />
      <section className="contents">
        <ItemTag
          items={[
            `# Courses: ${totalCourses} (${totalCredits} cr)`,
            `# Planned Courses: ${totalPlannedCourses} (${totalPlanCredits} cr)`,
            `# Course Taken: ${totalCourseTaken} (${totalCourseTakenCretids} cr)`,
            `# Terms: ${totalTerm} (${averageCreditsPerTerm} cr/term)`,
          ]}
          title="Plan Stats"
        />
      </section>
      <GithubMark className="github-mark" />
    </section>
  );
};

export default UtilityBar;
