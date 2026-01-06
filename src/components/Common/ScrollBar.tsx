"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { clamp } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";
import { useDebounce } from "@/lib/hooks/common";

export const ScrollBar = ({
  targetContainerRef,
  dependentContainerRef,
  direction,
  style,
  bindScroll,
  unbindScroll,
  setScrollable,
  thumbStyle,
  className,
}: {
  targetContainerRef: React.RefObject<HTMLDivElement | HTMLBodyElement | null>;
  dependentContainerRef?: React.RefObject<
    HTMLDivElement | HTMLBodyElement | null
  >;
  direction: "horizontal" | "vertical";
  bindScroll: (cb: () => void) => void;
  unbindScroll: (cb: () => void) => void;
  setScrollable?: (scrollable: boolean) => void;
  style?: React.CSSProperties;
  thumbStyle?: React.CSSProperties;
  className?: string;
}) => {
  const scrollBarRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const thumbRatioRef = useRef(0);
  const isShowRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  const isInitialized = useAppSelector((state) => state.global.isInitialized);

  const debouncedHideScrollBar = useDebounce(() => {
    isShowRef.current = false;
    scrollBarRef.current?.classList.remove("show");
  }, 500);

  const isSideBarFolded = useAppSelector(
    (state) => state.global.isSideBarFolded,
  );

  const maxScroll = useRef(0);
  const scrollBarMaxScroll = useRef(0);
  const lastX = useRef(0);
  const lastY = useRef(0);

  const handleScrollChange = useCallback(
    (notShow?: boolean) => {
      const parent = targetContainerRef.current;
      const scrollBar = scrollBarRef.current;
      const thumb = thumbRef.current;
      if (!parent || !scrollBar || !thumb) {
        return;
      }
      const thumbRatio = thumbRatioRef.current;

      // must be a boolean
      if (notShow !== true) {
        isShowRef.current = true;
        scrollBarRef.current?.classList.add("show");
      }

      let progress =
        direction === "horizontal"
          ? parent.scrollLeft / parent.scrollWidth
          : parent.scrollTop / parent.scrollHeight;
      progress = clamp(Number(progress.toFixed(4)), 0, 1);

      if (direction === "horizontal") {
        thumb.style.left = `${progress * 100}%`;
        thumb.style.width = `${thumbRatio * 100}%`;
      } else {
        thumb.style.top = `${progress * 100}%`;
        thumb.style.height = `${thumbRatio * 100}%`;
      }

      debouncedHideScrollBar();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [direction, debouncedHideScrollBar],
  );

  const handleScroll = useCallback(
    (e: MouseEvent) => {
      const parent = targetContainerRef.current;
      const scrollBar = scrollBarRef.current;

      if (!parent || !scrollBar) {
        return;
      }

      const currentScroll =
        direction === "horizontal" ? parent.scrollLeft : parent.scrollTop;

      if (direction === "horizontal") {
        const mouseDX = e.clientX - lastX.current;
        const targetDX =
          maxScroll.current * (mouseDX / scrollBarMaxScroll.current);

        parent.scrollLeft = currentScroll + targetDX;
        lastX.current = e.clientX;
      } else {
        const mouseDY = e.clientY - lastY.current;
        const targetDY =
          maxScroll.current * (mouseDY / scrollBarMaxScroll.current);

        parent.scrollTop = currentScroll + targetDY;
        lastY.current = e.clientY;
      }
    },
    [targetContainerRef, direction],
  );

  const handleScrollEnd = useCallback(() => {
    const parent = targetContainerRef.current;
    const scrollBar = scrollBarRef.current;

    if (!parent || !scrollBar) {
      return;
    }

    lastX.current = 0;
    lastY.current = 0;

    setIsDragging(false);
    debouncedHideScrollBar();

    window.removeEventListener("mousemove", handleScroll as EventListener);
  }, [targetContainerRef, handleScroll, debouncedHideScrollBar]);

  const handleScrollStart = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const parent = targetContainerRef.current;
      const scrollBar = scrollBarRef.current;

      if (!parent || !scrollBar) {
        return;
      }

      lastX.current = e.clientX;
      lastY.current = e.clientY;

      setIsDragging(true);

      window.addEventListener("mousemove", handleScroll);
      window.addEventListener("mouseup", handleScrollEnd, { once: true });
      window.addEventListener("mouseleave", handleScrollEnd, { once: true });
    },
    [targetContainerRef, handleScroll, handleScrollEnd],
  );

  const handleResize = useCallback(() => {
    const parent = targetContainerRef.current;
    const scrollBar = scrollBarRef.current;

    if (!parent || !scrollBar) {
      return;
    }

    // visible area
    const clientSize =
      direction === "horizontal" ? parent.clientWidth : parent.clientHeight;
    // scrollable size
    const scrollSize =
      direction === "horizontal" ? parent.scrollWidth : parent.scrollHeight;
    const thumbRatio = clientSize / scrollSize;
    const scrollBarSize =
      direction === "horizontal"
        ? scrollBar.getBoundingClientRect().width
        : scrollBar.getBoundingClientRect().height;
    maxScroll.current = scrollSize - clientSize;
    scrollBarMaxScroll.current =
      scrollBarSize * (maxScroll.current / scrollSize);

    thumbRatioRef.current = thumbRatio;

    if (thumbRatio === 1) scrollBarRef.current?.classList.add("hidden");
    else scrollBarRef.current?.classList.remove("hidden");

    setScrollable?.(thumbRatio < 1);
    handleScrollChange(true);
  }, [targetContainerRef, direction, handleScrollChange, setScrollable]);

  useEffect(() => {
    bindScroll(handleScrollChange);
    return () => unbindScroll(handleScrollChange);
  }, [bindScroll, unbindScroll, handleScrollChange]);

  useEffect(() => {
    if (!scrollBarRef.current || !targetContainerRef.current) return;

    // init maxScroll and thumbSize
    handleResize();

    // use resizeObserver to update maxScroll and thumbSize
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(targetContainerRef.current);

    const mutationObserver = new MutationObserver(handleResize);
    mutationObserver.observe(targetContainerRef.current, {
      childList: true,
    });

    // if dependent container is provided, observe it for child list changes
    if (dependentContainerRef?.current) {
      mutationObserver.observe(dependentContainerRef.current, {
        childList: true,
      });
    }

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [
    isInitialized,
    dependentContainerRef,
    targetContainerRef,
    direction,
    handleResize,
  ]);

  useEffect(() => {
    if (!isInitialized) return;
    setTimeout(handleResize, 200); // wait for sidebar to be folded
    // also depends on sidebar folded state
  }, [isSideBarFolded, handleResize, isInitialized]);

  if (!isInitialized) return null;

  return (
    <div
      ref={scrollBarRef}
      className={clsx(
        "scroll-track",
        direction,
        isDragging && "dragging",
        className,
      )}
      style={style}
    >
      <div
        className="scroll-bar-thumb"
        ref={thumbRef}
        onMouseDown={handleScrollStart}
        style={thumbStyle}
      />
    </div>
  );
};

export default ScrollBar;
