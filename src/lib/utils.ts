import FlexSearch from "flexsearch";
import type { Course } from "@/types/db";
import { SCROLL_OFFSET } from "./constants";

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
  const result = [] as string[];
  const uniqueResult = new Set<string>();

  query
    .flatMap((i) => i.result)
    .forEach((r) => {
      // match id first, then name
      const courseId = r.toString();
      if (!uniqueResult.has(courseId)) {
        result.push(courseId);
        uniqueResult.add(courseId);
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
      ? termCard === -1
        ? Array.from(termsBox.children)
            .reverse()
            .find((child) => {
              const termCardElement = child as HTMLDivElement;
              return termCardElement.classList.contains("term-card");
            })
        : termsBox?.children[termCard]
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

export const scrollCourseCardToView = (
  courseId: string,
  options: Omit<ScrollOptions, "container">,
) => {
  const courseCardElem = document.body.querySelector(`#${courseId}`);
  if (!courseCardElem) return;

  const termBodyElem = courseCardElem.parentElement;
  if (!termBodyElem) {
    throw new Error("Term body element not found");
  }

  const termCardElem = termBodyElem.parentElement;
  if (!termCardElem) {
    throw new Error("Term card element not found");
  }

  const termBodyScrollTop = termBodyElem.scrollTop;
  const termBodyHeight = termBodyElem.clientHeight;
  const termBodyTop =
    termBodyElem.getBoundingClientRect().top +
    SCROLL_OFFSET.TERM_BODY_HEIGHT_COEF * termBodyHeight;
  const maxScrollTop = termBodyElem.scrollHeight - termBodyHeight;

  const courseCardTop = courseCardElem.getBoundingClientRect().top;
  const courseCardBottomPadding = courseCardElem
    .computedStyleMap()
    .get("margin-bottom") as CSSUnitValue;

  const scrollDistance = courseCardTop - termBodyTop;
  // console.group("scrollCourseCardToView");
  // console.log(courseCardTop, termBodyTop, courseCardCenterY, clientCenterY);
  // console.log(isLargerThanTermBody);
  // console.log(scrollDistance);
  // console.groupEnd();

  const targetY = clamp(
    termBodyScrollTop + scrollDistance - courseCardBottomPadding.value,
    0,
    maxScrollTop,
  );

  const scrollCourseCard = () =>
    smoothScrollTo({
      targetY,
      container: termBodyElem,
      ...options,
    });

  scrollTermCardToView(termCardElem, {
    duration: 300,
    onComplete: () => {
      scrollCourseCard();
    },
  });
};

export const getCommandKey = () => {
  if (navigator.userAgent.includes("Mac")) {
    return "⌘";
  }
  return "Ctrl";
};

// singleton search function
let searchFn: ((query: string) => Promise<string[]>) | null = null;

export const getSearchFn = (courseData: Course[]) => {
  if (searchFn) return searchFn;

  const index = new FlexSearch.Document<Course>({
    document: {
      id: "id",
      index: [
        {
          field: "id",
          tokenize: "full",
          resolution: 9,
        },
        {
          field: "name",
          tokenize: "full",
          resolution: 9,
        },
      ],
    },
  });

  // synchronous indexing
  courseData.forEach((course) => {
    index.add(course);
  });

  searchFn = async (query: string) => {
    const result = await index.searchAsync(query, { enrich: true });
    return processQuery(result); // TODO: put into searchAsync callback?
  };

  return searchFn;
};
