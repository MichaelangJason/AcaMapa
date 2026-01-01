"use client";

import AppActions from "./AppActions";
import UserUtilities from "./UserUtilities";
import UtilityDropdown from "./UtilityDropdown";
import { useEffect, useRef } from "react";

const UtilityBar = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stopScrollPropagation = (e: WheelEvent) => {
      e.stopPropagation();
    };

    if (ref.current) {
      ref.current.addEventListener("wheel", stopScrollPropagation);
    }

    return () => {
      if (ref.current) {
        ref.current.removeEventListener("wheel", stopScrollPropagation);
      }
    };
  }, []);

  return (
    <section className="utility-bar" ref={ref}>
      <UtilityDropdown />
      <AppActions />
      <UserUtilities />
    </section>
  );
};

export default UtilityBar;
