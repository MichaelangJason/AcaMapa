import Skeleton from "react-loading-skeleton";
import { SKELETON_CONFIG } from "@/lib/constants";
import SeekIcon from "@/public/icons/telescope.svg";
import ExpandIcon from "@/public/icons/expand-single.svg";
import DeleteIcon from "@/public/icons/delete.svg";
import { useMemo } from "react";

const DetailedCourseCardSkeleton = ({
  numReqNotes,
}: {
  numReqNotes: number;
}) => {
  const reqNotesArr = useMemo(() => {
    return new Array(numReqNotes).fill(null);
  }, [numReqNotes]);

  return (
    <article className="course-card expanded skeleton">
      <header className="course-card-header">
        <h4 className="heading">
          <Skeleton
            baseColor="var(--grey-2)"
            highlightColor="var(--grey-1)"
            width={SKELETON_CONFIG.COURSE_CARD.HEADING.WIDTH}
            height={SKELETON_CONFIG.COURSE_CARD.HEADING.HEIGHT}
            borderRadius={SKELETON_CONFIG.COURSE_CARD.HEADING.RADIUS}
          />
        </h4>
        <h5 className="subheading">
          <Skeleton
            baseColor="var(--grey-2)"
            highlightColor="var(--grey-1)"
            width={SKELETON_CONFIG.COURSE_CARD.HEADING.WIDTH}
            height={SKELETON_CONFIG.COURSE_CARD.SUBHEADING_HEIGHT}
          />
        </h5>
        <section className="icons-container">
          <div className="seek disabled">
            <SeekIcon />
          </div>
          <div className="expand disabled">
            <ExpandIcon />
          </div>
          <div className="delete disabled">
            <DeleteIcon />
          </div>
        </section>
        <div className="credits skeleton">
          <Skeleton
            baseColor="var(--grey-2)"
            highlightColor="var(--grey-1)"
            width={SKELETON_CONFIG.COURSE_CARD.CREDITS.DETAILED_WIDTH}
            height={SKELETON_CONFIG.COURSE_CARD.CREDITS.COMMON}
            borderRadius={SKELETON_CONFIG.COURSE_CARD.CREDITS.RADIUS}
          />
        </div>
      </header>
      {reqNotesArr.map((_, idx) => {
        return (
          <Skeleton
            key={idx}
            baseColor="var(--grey-2)"
            highlightColor="var(--grey-1)"
            containerClassName="req-note-skeleton"
            height={SKELETON_CONFIG.COURSE_CARD.REQNOTES.HEIGHT}
            width={SKELETON_CONFIG.COURSE_CARD.REQNOTES.WIDTH}
            borderRadius={SKELETON_CONFIG.COURSE_CARD.REQNOTES.RADIUS}
          />
        );
      })}
    </article>
  );
};

export default DetailedCourseCardSkeleton;
