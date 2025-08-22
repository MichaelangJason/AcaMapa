import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { clamp } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";
import { useDebounce } from "@/lib/hooks";

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
  const [progress, setProgress] = useState(0);
  const [thumbRatio, setThumbRatio] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const isInitialized = useAppSelector((state) => state.global.isInitialized);
  const [isShow, setIsShow] = useState(false);
  const hideScrollBar = useDebounce(() => setIsShow(false), 500);
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

      if (!parent || !scrollBar) {
        return;
      }
      // must be a boolean to avoid type error
      if (notShow !== true) setIsShow(true);

      let progress: number;
      if (direction === "horizontal") {
        progress = parent.scrollLeft / parent.scrollWidth;
      } else {
        progress = parent.scrollTop / parent.scrollHeight;
      }

      progress = clamp(Number(progress.toFixed(4)), 0, 1);

      setProgress(progress * 100);
      hideScrollBar();
    },
    [targetContainerRef, direction, hideScrollBar],
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
    hideScrollBar();

    window.removeEventListener("mousemove", handleScroll as EventListener);
  }, [targetContainerRef, handleScroll, hideScrollBar]);

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
    setThumbRatio(thumbRatio);
    setScrollable?.(thumbRatio < 1);
    handleScrollChange(true);
  }, [targetContainerRef, direction, handleScrollChange, setScrollable]);

  useEffect(() => {
    if (!scrollBarRef.current || !targetContainerRef.current) return;

    // init maxScroll and thumbSize
    handleResize();

    bindScroll(handleScrollChange);
    // bindResize(handleResize);
    // use resizeObserver to update maxScroll and thumbSize

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(targetContainerRef.current);
    const mutationObserver = new MutationObserver(handleResize);

    mutationObserver.observe(targetContainerRef.current, {
      childList: true,
    });
    if (dependentContainerRef?.current) {
      mutationObserver.observe(dependentContainerRef.current, {
        childList: true,
      });
    }

    return () => {
      unbindScroll(handleScrollChange);
      // unbindResize(handleResize);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [
    isInitialized,
    dependentContainerRef,
    targetContainerRef,
    direction,
    handleResize,
    handleScrollChange,
    bindScroll,
    unbindScroll,
  ]);

  useEffect(() => {
    if (!isInitialized) return;
    setTimeout(() => {
      handleResize();
    }, 200); // wait for sidebar to be folded
  }, [isSideBarFolded, handleResize, isInitialized]);

  if (!isInitialized) return null;

  return (
    <div
      ref={scrollBarRef}
      className={clsx(
        "scroll-track",
        direction,
        isShow && "show",
        isDragging && "dragging",
        thumbRatio === 1 && "hidden",
        className,
      )}
      style={style}
    >
      <div
        className="scroll-bar-thumb"
        onMouseDown={handleScrollStart}
        style={{
          ...thumbStyle,
          left: direction === "horizontal" ? `${progress}%` : undefined,
          top: direction === "vertical" ? `${progress}%` : undefined,
          width:
            direction === "horizontal" ? `${thumbRatio * 100}%` : undefined,
          height: direction === "vertical" ? `${thumbRatio * 100}%` : undefined,
        }}
      />
    </div>
  );
};

export default ScrollBar;
