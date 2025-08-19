import { GroupType, ReqType } from "@/lib/enums";
import { Tag } from "@/components/Common";
import {
  clamp,
  formatCourseId,
  scrollCourseCardToView,
  smoothScrollTo,
} from "@/lib/utils";
import type { EnhancedRequisites, ReqGroup, TooltipProps } from "@/types/local";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type JSX,
} from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectCourseDepMeta } from "@/store/selectors";
import ScrollIcon from "@/public/icons/expand-single.svg";
import clsx from "clsx";
import { COURSE_TAKEN_SCROLL_DELAY, SCROLL_OFFSET } from "@/lib/constants";
import { getTagStatus, getTagToolTip } from "@/lib/course";
import { addCourseTaken } from "@/store/slices/userDataSlice";
import { setIsCourseTakenExpanded } from "@/store/slices/globalSlice";
import { TooltipId } from "@/lib/enums";
import { Language } from "@/lib/i18n";

const ReqNotes = ({
  parentCourse,
  title,
  requisites,
  notes = [],
  planId,
  termId,
  includeCurrentTerm = false,
  type,
}: {
  parentCourse: string;
  title: string;
  type: ReqType;
  requisites?: EnhancedRequisites;
  notes?: string[];
  planId: string;
  termId: string;
  includeCurrentTerm?: boolean;
}) => {
  const [showScrollLeft, setShowScrollLeft] = useState(false);
  const [showScrollRight, setShowScrollRight] = useState(false);
  // REVIEW: switch to initialization state + skeleton?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isOverflowing, setIsOverflowing] = useState(false);
  const reqGroupRef = useRef<HTMLDivElement>(null);
  const leftScrollIconRef = useRef<HTMLDivElement>(null);
  const rightScrollIconRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();

  const addToCourseTakenOrJump = useCallback(
    (courseId?: string, source?: string) => {
      if (!courseId) return;
      if (!source) {
        dispatch(addCourseTaken([courseId]));
      } else {
        if (source.toLowerCase() === "course taken") {
          dispatch(setIsCourseTakenExpanded(true));
          setTimeout(() => {
            document
              .getElementById(`course-taken-${courseId}`)
              ?.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
          }, COURSE_TAKEN_SCROLL_DELAY);
        } else {
          scrollCourseCardToView(courseId, { duration: 200 });
        }
      }
    },
    [dispatch],
  );

  useEffect(() => {
    if (
      !reqGroupRef.current ||
      !leftScrollIconRef.current ||
      !rightScrollIconRef.current
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

    const setScrollIcons = () => {
      setShowScrollLeft(container.scrollLeft > 0);
      setShowScrollRight(
        container.scrollLeft + containerWidth <
          firstReqGroupWidth + 2 * scrollIcon.clientWidth,
      );
    };

    const containerMaxScrollLeft = container.scrollWidth - containerWidth;

    const scrollLeft = (e: MouseEvent) => {
      e.preventDefault();
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
      e.preventDefault();
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

    const verticalScrollCb = (e: WheelEvent) => {
      const scrollAmount = e.deltaY + e.deltaX;
      const prevScrollLeft = container.scrollLeft;
      const containerMaxScrollLeft =
        container.scrollWidth - container.clientWidth;
      const nextScrollLeft = clamp(
        prevScrollLeft + scrollAmount,
        0,
        containerMaxScrollLeft,
      );

      // Only prevent default if there is actually something to scroll
      if (
        (scrollAmount < 0 && prevScrollLeft > 0) ||
        (scrollAmount > 0 && prevScrollLeft < containerMaxScrollLeft)
      ) {
        e.preventDefault();
        e.stopPropagation();
        container.scrollLeft = nextScrollLeft;
        setScrollIcons();
      }
    };

    // scroll needed, bind a scroll listener
    if (firstReqGroupWidth > containerWidth) {
      setIsOverflowing(true);
      container.addEventListener("wheel", verticalScrollCb);
      leftScrollIcon.addEventListener("click", scrollLeft);
      rightScrollIcon.addEventListener("click", scrollRight);
      setScrollIcons();
    }

    return () => {
      setIsOverflowing(false);
      container.removeEventListener("wheel", verticalScrollCb);
      leftScrollIcon.removeEventListener("click", scrollLeft);
      rightScrollIcon.removeEventListener("click", scrollRight);
    };
  }, []);

  return (
    <section className="req-note">
      <header>{title}:</header>
      {requisites?.group && requisites.group.type !== GroupType.EMPTY && (
        <section
          className="req-group-container scrollbar-hidden"
          ref={reqGroupRef}
        >
          <div
            className={clsx(
              "scroll-icon-container left",
              !showScrollLeft && "transparent",
              "enabled",
            )}
            ref={leftScrollIconRef}
          >
            <ScrollIcon />
          </div>
          <ReqGroup
            parentCourse={parentCourse}
            group={requisites.group}
            includeCurrentTerm={includeCurrentTerm}
            termId={termId}
            reqType={type}
            addToCourseTakenOrJump={addToCourseTakenOrJump}
            planId={planId}
          />
          <div
            className={clsx(
              "scroll-icon-container right",
              !showScrollRight && "transparent",
              "enabled",
            )}
            ref={rightScrollIconRef}
          >
            <ScrollIcon />
          </div>
        </section>
      )}
      <ul className="notes">
        {requisites?.raw && <li>{requisites.raw}</li>}
        {notes.map((note, idx) => (
          <li key={idx}>{note}</li>
        ))}
      </ul>
    </section>
  );
};

const ReqGroup = ({
  parentCourse,
  group,
  flexDirection = "row",
  includeCurrentTerm = false,
  termId,
  reqType,
  addToCourseTakenOrJump,
  planId,
}: {
  parentCourse: string;
  group: ReqGroup;
  flexDirection?: CSSProperties["flexDirection"];
  includeCurrentTerm?: boolean;
  termId: string;
  reqType: ReqType;
  addToCourseTakenOrJump: (courseId?: string, source?: string) => void;
  planId: string;
}) => {
  let children: JSX.Element[] = [];
  const { getCourseSource, getValidCourses } = useAppSelector((state) =>
    selectCourseDepMeta(state, planId),
  );
  const lang = useAppSelector((state) => state.userData.lang) as Language;

  switch (group.type) {
    case GroupType.EMPTY: {
      return null;
    }
    case GroupType.SINGLE:
    case GroupType.AND:
    case GroupType.OR: {
      const delimiter =
        group.type === GroupType.SINGLE ? null : group.type.valueOf();

      const entries = group.inner.map((item, idx) => {
        if (typeof item === "string") {
          // TODO: source check
          const { isValid, source } = getCourseSource(
            item,
            termId,
            reqType,
            includeCurrentTerm,
          );
          const status = getTagStatus(source, isValid);
          const tooltipMsg = getTagToolTip(source, isValid, lang);

          return (
            <Tag
              key={`${parentCourse}-${group.type}-${idx}-${item}`}
              sourceText={item}
              displayText={formatCourseId(item)}
              className={clsx(status, "clickable")}
              callback={(item) => addToCourseTakenOrJump(item, source)}
              tooltipOptions={{
                "data-tooltip-id": TooltipId.REQ_NOTES_TAG,
                "data-tooltip-content": tooltipMsg,
              }}
            />
          );
        } else {
          return (
            <ReqGroup
              key={`${parentCourse}-${group.type}-${idx}-${item.type.valueOf()}`}
              parentCourse={parentCourse}
              group={item}
              flexDirection={flexDirection === "row" ? "column" : "row"}
              termId={termId}
              reqType={reqType}
              addToCourseTakenOrJump={addToCourseTakenOrJump}
              planId={planId}
            />
          );
        }
      });

      children = entries.flatMap((item, idx) =>
        idx === 0
          ? [item]
          : [
              <span className="delimiter" key={`delimiter-${idx}`}>
                {delimiter}
              </span>,
              item,
            ],
      );

      break;
    }

    case GroupType.PAIR: {
      // every is used for typing usage, can also use some
      if (!group.inner.every((i) => typeof i === "string")) {
        throw new Error("Pair group cannot contain non-string");
      }

      children = group.inner.map((item, idx) => {
        const { isValid, source } = getCourseSource(
          item,
          termId,
          reqType,
          includeCurrentTerm,
        );
        const status = getTagStatus(source, isValid);
        const tooltipMsg = getTagToolTip(source, isValid, lang);
        return (
          <Tag
            key={`${parentCourse}-${group.type}-${idx}-${item}`}
            sourceText={item}
            displayText={formatCourseId(item)}
            className={clsx(status, "clickable")}
            callback={(item) => addToCourseTakenOrJump(item, source)}
            tooltipOptions={{
              "data-tooltip-id": TooltipId.REQ_NOTES_TAG,
              "data-tooltip-content": tooltipMsg,
            }}
          />
        );
      });

      children.unshift(
        <span
          key={`${parentCourse}-${group.type.valueOf()}-title`}
          className="req-title"
        >
          TWO FROM:
        </span>,
      );

      break;
    }

    // rare case, no need to over optimize for this case
    // there will be no nested cases
    case GroupType.CREDIT: {
      // every is used for typing usage, can also use some
      if (!group.inner.every((i) => typeof i === "string")) {
        throw new Error("Credit group cannot contain non-string");
      }

      const [req, scopes, ...subjects] = group.inner;

      const { totalCredits, validSubjectMap } = getValidCourses(
        new Set(subjects),
        scopes,
        termId,
        includeCurrentTerm,
      );
      const status =
        totalCredits >= parseFloat(req) ? "satisfied" : "unsatisfied";

      const levels =
        scopes[0] === "0"
          ? "-ANY"
          : scopes.length > 1
            ? `>=${scopes[0]}XX`
            : `-${scopes[0]}XX`;

      children = subjects.map((subject, idx) => {
        const subjectToolTipMsg =
          validSubjectMap[subject] === undefined ||
          validSubjectMap[subject].totalCredits === 0
            ? ["No Valid Course"]
            : Object.entries(validSubjectMap[subject].validCourses).map(
                (val) => {
                  const [courseId, { source, credits }] = val;
                  return `${formatCourseId(courseId)} (${credits}): ${source}`;
                },
              );

        const tooltipOptions =
          subjectToolTipMsg === undefined
            ? {}
            : ({
                "data-tooltip-id": TooltipId.REQ_NOTES_TAG,
                "data-tooltip-html": subjectToolTipMsg.join("<br />"),
              } as TooltipProps);

        return (
          <Tag
            key={`${parentCourse}-${group.type}-${idx}-${subject}`}
            sourceText={subject}
            displayText={
              subject.toUpperCase() +
              levels +
              `(${validSubjectMap[subject]?.totalCredits ?? 0})`
            }
            className={clsx([
              validSubjectMap[subject]?.totalCredits > 0 && status,
            ])}
            tooltipOptions={tooltipOptions}
          />
        );
      });

      children.unshift(
        <span
          key={`${parentCourse}-${group.type.valueOf()}-title`}
          className="req-title"
        >
          AT LEAST <strong>{req}</strong> CREDITS FROM:
        </span>,
      );
    }
  }

  return (
    <div
      className="req-group"
      style={{
        flexDirection: [GroupType.PAIR, GroupType.CREDIT].includes(group.type)
          ? "column"
          : flexDirection,
        gap:
          flexDirection === "column" && group.type !== GroupType.PAIR
            ? "0.125rem"
            : undefined,
      }}
    >
      {children}
    </div>
  );
};

export default ReqNotes;
