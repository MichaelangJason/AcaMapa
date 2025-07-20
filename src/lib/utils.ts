import type FlexSearch from "flexsearch";
import type { Course } from "@/types/course";

export const debounce = <T>(
  fn: (...args: any[]) => Promise<T>,
  delay: number,
) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]): Promise<T> => {
    return new Promise((resolve) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        const result = await fn(...args);
        resolve(result);
      }, delay);
    });
  };
};

export const processQuery = (
  query: FlexSearch.SimpleDocumentSearchResultSetUnit[],
) => {
  const result = [] as Course[];
  const uniqueResult = new Set<string>();

  query
    .flatMap((i) => i.result)
    .forEach((r) => {
      const course = (r as unknown as { doc: Course; id: string }).doc;
      if (!uniqueResult.has(course.id)) {
        result.push(course);
        uniqueResult.add(course.id);
      }
    });

  return result;
};

export const formatCourseId = (
  id: string,
  separator = " ",
  isLower = false,
) => {
  const formatted = (id.slice(0, 4) + separator + id.slice(4)).toUpperCase();
  return isLower ? formatted.toLowerCase() : formatted;
};

export const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(value, max));
};

export const getComputedStyleValueByClassName = (
  className: string,
  key: string,
) => {
  const element = document.querySelector(`.${className}`);
  if (!element) return undefined;
  return getComputedStyle(element).getPropertyValue(key);
};

interface ScrollOptions {
  container: Window | Element;
  targetX?: number;
  targetY?: number;
  duration?: number;
  easing?: (t: number) => number;
  onComplete?: () => void;
}

export const smoothScrollTo = ({
  container,
  targetX,
  targetY,
  duration = 500,
  easing = (t) =>
    t < 0.5 ? 4 * Math.pow(t, 3) : 1 - Math.pow(-2 * t + 2, 3) / 2,
  onComplete,
}: ScrollOptions) => {
  let animationFrame: number;
  let isCancelled = false;

  const startX =
    "scrollX" in container ? container.scrollX : container.scrollLeft;
  const startY =
    "scrollY" in container ? container.scrollY : container.scrollTop;

  const distanceX = targetX !== undefined ? targetX - startX : 0;
  const distanceY = targetY !== undefined ? targetY - startY : 0;

  const startTime = performance.now();

  function scroll(currentTime: number) {
    if (isCancelled) return;

    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);

    if (targetX !== undefined) {
      const currentX = startX + distanceX * easedProgress;
      if ("scrollTo" in container) {
        container.scrollTo({ left: currentX });
      } else {
        (container as HTMLElement).scrollLeft = currentX;
      }
    }

    if (targetY !== undefined) {
      const currentY = startY + distanceY * easedProgress;
      if ("scrollTo" in container) {
        container.scrollTo({ top: currentY });
      } else {
        (container as HTMLElement).scrollTop = currentY;
      }
    }

    if (progress < 1) {
      animationFrame = requestAnimationFrame(scroll);
    } else {
      if (onComplete) onComplete();
    }
  }

  // Start animation in next rAF
  animationFrame = requestAnimationFrame(scroll);

  // Return cancel function
  return () => {
    isCancelled = true;
    cancelAnimationFrame(animationFrame);
  };
};

export const scrollTermCardToView = (
  termCard: HTMLElement | number,
  options: Omit<ScrollOptions, "container">,
) => {
  const docElm = document.documentElement;
  if (!docElm) return;

  const docElLeft = (
    document.body.computedStyleMap().get("padding-left") as CSSUnitValue
  ).value;
  const docElScrollLeft = window.scrollX;
  const maxScrollLeft = docElm.scrollWidth - docElm.clientWidth;

  const termsBox = document.getElementById("terms");

  if (!termsBox) return;

  const termCardElement =
    typeof termCard === "number"
      ? termsBox?.children[
          termCard === -1 ? termsBox.children.length - 1 : termCard
        ]
      : termCard;

  if (
    !termCardElement ||
    !(termCardElement instanceof HTMLDivElement) ||
    !termCardElement.classList.contains("term-card")
  )
    return;

  const termCardLeft = termCardElement.getBoundingClientRect().left;
  const termCardCenter = termCardLeft + termCardElement.clientWidth / 2;

  const clientCenterX = document.documentElement.clientWidth / 2;
  const offsetX = clientCenterX - docElLeft;

  const targetX = clamp(
    docElScrollLeft - (docElLeft - termCardCenter + offsetX),
    0,
    maxScrollLeft,
  );

  // TODO: Add a mousemove listener to the document body to cancel the scroll animation when the mouse is moved
  return smoothScrollTo({
    targetX,
    container: docElm,
    ...options,
  });
};

export const getCommandKey = () => {
  if (navigator.userAgent.includes("Mac")) {
    return "⌘";
  }
  return "Ctrl";
};
