import { clamp } from "./helpers";
import { SCROLL_OFFSET } from "@/lib/constants";

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
        : termsBox?.children[termCard + 1]
      : termCard;

  if (
    !termCardElement ||
    !(termCardElement instanceof HTMLElement) ||
    !termCardElement.classList.contains("term-card")
  ) {
    return;
  }

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

  const courseCardWrapper = courseCardElem.parentElement;
  const termBodyElem = courseCardWrapper?.parentElement;
  if (!termBodyElem) {
    throw new Error("Term body element not found");
  }

  const termCardElem = termBodyElem.parentElement;
  if (!termCardElem) {
    throw new Error("Term card element not found");
  }

  const wrapperScrollTop = courseCardWrapper.scrollTop;
  const wrapperHeight = courseCardWrapper.clientHeight;
  const wrapperTop =
    courseCardWrapper.getBoundingClientRect().top +
    SCROLL_OFFSET.TERM_BODY_HEIGHT_COEF * wrapperHeight;
  const maxScrollTop = courseCardWrapper.scrollHeight - wrapperHeight;

  const courseCardTop = courseCardElem.getBoundingClientRect().top;
  const courseCardBottomPadding = courseCardElem
    .computedStyleMap()
    .get("margin-bottom") as CSSUnitValue;

  const scrollDistance = courseCardTop - wrapperTop;
  // console.group("scrollCourseCardToView");
  // console.log(courseCardTop, termBodyTop);
  // console.log(scrollDistance);
  // console.groupEnd();

  const targetY = clamp(
    wrapperScrollTop + scrollDistance - courseCardBottomPadding.value,
    0,
    maxScrollTop,
  );

  const scrollCourseCard = () =>
    smoothScrollTo({
      targetY,
      container: courseCardWrapper,
      ...options,
    });

  scrollTermCardToView(termCardElem, {
    duration: 300,
    onComplete: () => {
      scrollCourseCard();
    },
  });
};
