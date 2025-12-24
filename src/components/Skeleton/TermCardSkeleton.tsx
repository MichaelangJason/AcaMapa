import Skeleton from "react-loading-skeleton";
import HamburgerIcon from "@/public/icons/hamburger.svg";
import PlusIcon from "@/public/icons/plus.svg";
import { SKELETON_CONFIG } from "@/lib/constants";
import DetailedCourseCardSkeleton from "./DetailedCourseCardSkeleton";

const TermCardSkeleton = ({
  isFirst,
  numCourses,
}: {
  isFirst: boolean;
  numCourses: number;
}) => {
  return (
    <div className="term-card">
      <div className="term-header">
        <Skeleton
          baseColor="var(--grey-2)"
          highlightColor="var(--grey-1)"
          width={SKELETON_CONFIG.TERM_CARD_CONTENT.WIDTH}
          height={SKELETON_CONFIG.TERM_CARD_CONTENT.HEIGHT}
        />
        <HamburgerIcon className="hamburger disabled" />
      </div>
      <div className="term-body scroll-disabled">
        {Array.from({ length: numCourses }).map((_, idx) => (
          <DetailedCourseCardSkeleton key={idx} numReqNotes={idx + 1} />
        ))}
      </div>
      <footer className="term-footer">
        <Skeleton
          baseColor="var(--grey-2)"
          highlightColor="var(--grey-1)"
          width={SKELETON_CONFIG.TERM_CARD_CONTENT.WIDTH}
          height={SKELETON_CONFIG.TERM_CARD_CONTENT.HEIGHT}
        />
      </footer>
      {isFirst && (
        <button className="add-term-button on-left disabled">
          <PlusIcon />
        </button>
      )}
      <button className="add-term-button disabled">
        <PlusIcon />
      </button>
    </div>
  );
};

export default TermCardSkeleton;
