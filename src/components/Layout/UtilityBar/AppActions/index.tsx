"use client";

import ItemTagSkeleton from "@/components/Skeleton/ItemTagSkeleton";
import { useAppSelector } from "@/store/hooks";
import ProgramsTag from "./ProgramsTag";
import StatsTag from "./StatsTag";
import EquivRulesTag from "./EquivRulesTag";

const AppActions = () => {
  const isInitialized = useAppSelector((state) => state.global.isInitialized);

  return (
    <>
      {/* item tags: Programs, Plan Stats */}
      {/* skeleton loading */}
      {!isInitialized ? (
        <section className="item-tag-container skeleton">
          <ItemTagSkeleton width="1" />
          <ItemTagSkeleton width="2" />
        </section>
      ) : (
        // render item tags
        <section className="item-tag-container">
          <div className="item-tag-scroll-container scrollbar-hidden">
            <StatsTag />
            <ProgramsTag />
            <EquivRulesTag />
          </div>
        </section>
      )}
    </>
  );
};

export default AppActions;
