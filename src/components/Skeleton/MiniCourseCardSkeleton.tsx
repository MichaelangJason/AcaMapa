import Skeleton from "react-loading-skeleton";
import RemoveIcon from "@/public/icons/minus.svg";
import AddIcon from "@/public/icons/plus.svg";
import { SKELETON_CONFIG } from "@/lib/constants";

const MiniCourseCardSkeleton = ({
  isSelected = false,
}: {
  isSelected?: boolean;
}) => {
  const credisWidthHeight = SKELETON_CONFIG.COURSE_CARD.CREDITS.COMMON;
  const headingWidth = SKELETON_CONFIG.COURSE_CARD.HEADING.MINI_CARD_WIDTH;
  const radius = SKELETON_CONFIG.COURSE_CARD.HEADING.RADIUS;

  return (
    <article className="mini-course-card skeleton">
      <aside className="credits">
        <Skeleton
          baseColor="var(--grey-3)"
          highlightColor="var(--grey-2)"
          width={credisWidthHeight}
          height={credisWidthHeight}
          borderRadius={radius}
        />
      </aside>
      <section className="info">
        <Skeleton
          baseColor="var(--grey-3)"
          highlightColor="var(--grey-2)"
          width={headingWidth}
          height={SKELETON_CONFIG.COURSE_CARD.SUBHEADING_HEIGHT}
          borderRadius={radius}
        />
        <Skeleton
          baseColor="var(--grey-3)"
          highlightColor="var(--grey-2)"
          width={headingWidth}
          height={SKELETON_CONFIG.COURSE_CARD.HEADING.HEIGHT}
          borderRadius={radius}
        />
      </section>
      <aside className="icon-container skeleton disabled">
        {isSelected ? <RemoveIcon /> : <AddIcon />}
      </aside>
    </article>
  );
};

export default MiniCourseCardSkeleton;
