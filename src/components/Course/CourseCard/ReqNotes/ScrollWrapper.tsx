import ScrollIcon from "@/public/icons/expand-single.svg";
import { clamp, smoothScrollTo } from "@/lib/utils";
import { useEffect, useRef } from "react";
import { SCROLL_OFFSET } from "@/lib/constants";

const ScrollWrapper = ({
  children,
  reqGroupRef,
  reqNotesRef,
}: {
  children: React.ReactNode;
  reqGroupRef: React.RefObject<HTMLDivElement | null>;
  reqNotesRef: React.RefObject<HTMLDivElement | null>;
}) => {
  const leftScrollIconRef = useRef<HTMLDivElement>(null);
  const rightScrollIconRef = useRef<HTMLDivElement>(null);

  // check whether scroll icons are needed at beginning
  useEffect(() => {
    if (
      !reqGroupRef.current ||
      !leftScrollIconRef.current ||
      !rightScrollIconRef.current ||
      !reqNotesRef.current
    )
      return;
    const firstReqGroup = reqGroupRef.current.querySelector(".req-group");
    const scrollIcon = reqGroupRef.current.querySelector(
      ".scroll-icon-container",
    );
    if (!firstReqGroup || !scrollIcon) {
      throw new Error("No req group or right scroll icon found");
    }

    // guaranteed to have at least one child to render
    const container = reqGroupRef.current;
    const leftScrollIcon = leftScrollIconRef.current;
    const rightScrollIcon = rightScrollIconRef.current;
    const firstReqGroupWidth = firstReqGroup.clientWidth;
    const containerWidth = reqGroupRef.current.clientWidth;
    const reqNotesWidth = reqNotesRef.current.clientWidth;

    const scrollNeeded = container.scrollWidth > reqNotesWidth;

    if (!scrollNeeded) return;

    const setScrollIcons = () => {
      // left icon
      const leftOverflow = container.scrollLeft > 0;
      if (leftOverflow) {
        leftScrollIcon.classList.add("show");
      } else {
        leftScrollIcon.classList.remove("show");
      }

      // right icon
      const rightOverflow =
        container.scrollLeft + containerWidth <
        firstReqGroupWidth + 2 * scrollIcon.clientWidth;
      if (rightOverflow) {
        rightScrollIcon.classList.add("show");
      } else {
        rightScrollIcon.classList.remove("show");
      }
    };

    const containerMaxScrollLeft = container.scrollWidth - containerWidth;

    const scrollLeft = (e: MouseEvent) => {
      e.stopPropagation();

      smoothScrollTo({
        container,
        targetX: clamp(
          container.scrollLeft - SCROLL_OFFSET.SCROLL_ICON,
          0,
          containerMaxScrollLeft,
        ),
        duration: 200,
        onComplete: () => setScrollIcons(),
      });
    };

    const scrollRight = (e: MouseEvent) => {
      e.stopPropagation();

      smoothScrollTo({
        container,
        targetX: clamp(
          container.scrollLeft + SCROLL_OFFSET.SCROLL_ICON,
          0,
          containerMaxScrollLeft,
        ),
        duration: 200,
        onComplete: () => setScrollIcons(),
      });
    };

    // scroll needed, bind a scroll listener
    leftScrollIcon.addEventListener("click", scrollLeft);
    rightScrollIcon.addEventListener("click", scrollRight);
    setScrollIcons();

    return () => {
      leftScrollIcon.removeEventListener("click", scrollLeft);
      rightScrollIcon.removeEventListener("click", scrollRight);
    };
  }, [reqGroupRef, reqNotesRef, leftScrollIconRef, rightScrollIconRef]);

  return (
    <>
      {/* left scroll icon */}
      <div className="scroll-icon-container left" ref={leftScrollIconRef}>
        <ScrollIcon />
      </div>
      {children}
      {/* right scroll icon */}
      <div className="scroll-icon-container right" ref={rightScrollIconRef}>
        <ScrollIcon />
      </div>
    </>
  );
};

export default ScrollWrapper;
