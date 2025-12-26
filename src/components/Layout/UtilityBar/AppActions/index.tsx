"use client";

import ItemTagSkeleton from "@/components/Skeleton/ItemTagSkeleton";
import UtilityDropdown from "./UtilityDropdown";
import { useAppSelector } from "@/store/hooks";
import ProgramsTag from "./ProgramsTag";
import StatsTag from "./StatsTag";

const AppActions = () => {
  const isInitialized = useAppSelector((state) => state.global.isInitialized);

  return (
    <>
      <UtilityDropdown />

      {/* item tags: Programs, Plan Stats */}
      {/* skeleton loading */}
      {!isInitialized ? (
        <>
          <ItemTagSkeleton width="1" />
          <ItemTagSkeleton width="2" />
        </>
      ) : (
        // render item tags
        <section className="item-tag-container">
          <ProgramsTag />
          <StatsTag />
        </section>
      )}
    </>
  );
};

export default AppActions;
