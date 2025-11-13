"use client";

import { GroupType, ReqType } from "@/lib/enums";
import { Tag } from "@/components/Common";
import {
  clamp,
  formatCourseId,
  scrollCourseCardToView,
  smoothScrollTo,
} from "@/lib/utils";
import type { EnhancedRequisites, ReqGroup } from "@/types/local";
import {
  useCallback,
  useEffect,
  useRef,
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
import { addSelectedCourse } from "@/store/slices/localDataSlice";
import { setIsCourseTakenExpanded } from "@/store/slices/globalSlice";
import { TooltipId } from "@/lib/enums";
import { Language } from "@/lib/i18n";

/**
 * Used to display the requisites and notes of a course
 *
 * @param parentCourse - the parent course id
 * @param title - the title of the requisites
 * @param requisites - the requisites of the course
 * @param notes - the notes of the course
 * @param planId - the plan id
 * @param termId - the term id
 * @param includeCurrentTerm - whether to include the current term
 * @param type - the type of the requisites
 */
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
  parentCourse?: string;
  title: string;
  type: ReqType;
  requisites?: EnhancedRequisites;
  notes?: string[];
  planId?: string;
  termId?: string;
  includeCurrentTerm?: boolean;
}) => {
  const reqNotesRef = useRef<HTMLDivElement>(null);
  const reqGroupRef = useRef<HTMLDivElement>(null);
  const leftScrollIconRef = useRef<HTMLDivElement>(null);
  const rightScrollIconRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();

  const addToCourseTakenOrJump = useCallback(
    (
      e: React.MouseEvent<HTMLSpanElement>,
      courseId?: string,
      source?: string,
    ) => {
      if (!courseId) return;
      if (!source) {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          e.stopPropagation();
          dispatch(addSelectedCourse(courseId));
        } else {
          dispatch(addCourseTaken([courseId]));
        }
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

    // disable horizontal scroll in req group, use icons to scroll
    const disableScroll = (e: WheelEvent) => {
      e.preventDefault();
    };

    // scroll needed, bind a scroll listener
    container.addEventListener("wheel", disableScroll);
    leftScrollIcon.addEventListener("click", scrollLeft);
    rightScrollIcon.addEventListener("click", scrollRight);
    setScrollIcons();

    return () => {
      container.removeEventListener("wheel", disableScroll);
      leftScrollIcon.removeEventListener("click", scrollLeft);
      rightScrollIcon.removeEventListener("click", scrollRight);
    };
  }, []);

  const hasReq = requisites?.group && requisites.group.type !== GroupType.EMPTY;
  const showReqGroup = hasReq && parentCourse && termId && planId; // unsafe validity check

  return (
    <section className="req-note" ref={reqNotesRef}>
      {/* requirement title */}
      <header className={clsx(!hasReq && "no-req")}>{title}:</header>

      {/* requirement group */}
      {showReqGroup && (
        <section
          className="req-group-container scrollbar-hidden"
          ref={reqGroupRef}
        >
          {/* left scroll icon */}
          <div className="scroll-icon-container left" ref={leftScrollIconRef}>
            <ScrollIcon />
          </div>

          {/* requirement group */}
          <ReqGroup
            parentCourse={parentCourse}
            group={requisites.group}
            includeCurrentTerm={includeCurrentTerm}
            termId={termId}
            reqType={type}
            addToCourseTakenOrJump={addToCourseTakenOrJump}
            planId={planId}
          />

          {/* right scroll icon */}
          <div className="scroll-icon-container right" ref={rightScrollIconRef}>
            <ScrollIcon />
          </div>
        </section>
      )}

      {/* notes */}
      <ul className="notes">
        {requisites?.raw && <li>{requisites.raw}</li>}
        {notes.map((note, idx) => (
          <li key={`note-${parentCourse}-${type}-${idx}`}>{note}</li>
        ))}
      </ul>
    </section>
  );
};

/**
 * inner component to recursively render the requisites tags
 *
 * @param parentCourse - the parent course id
 * @param group - the group of the requisites
 * @param flexDirection - the flex display direction of the group
 * @param includeCurrentTerm - whether to include the current term to check validity
 * @param termId - the term id belonging to the parent course
 * @param reqType - the type of the requisites: pre, co, anti
 * @param addToCourseTakenOrJump - the function to add a course to the course taken or jump to the course card
 * @param planId - the plan id used to check the course source and validity
 * @returns
 */
const ReqGroup = ({
  parentCourse,
  termId,
  planId,
  group,
  reqType,

  includeCurrentTerm = false,
  addToCourseTakenOrJump,

  flexDirection = "row",
}: {
  parentCourse: string;
  termId: string;
  planId: string;
  reqType: ReqType;
  group: ReqGroup;

  includeCurrentTerm?: boolean;
  addToCourseTakenOrJump: (
    e: React.MouseEvent<HTMLSpanElement>,
    courseId?: string,
    source?: string,
  ) => void;

  flexDirection?: CSSProperties["flexDirection"];
}) => {
  let children: JSX.Element[] = [];
  const { getCourseSource, getValidCourses } = useAppSelector((state) =>
    selectCourseDepMeta(state, planId),
  );
  const lang = useAppSelector((state) => state.userData.lang) as Language;

  switch (group.type) {
    // empty group, no need to render
    case GroupType.EMPTY: {
      return null;
    }

    // simple group type with simple delimiter
    case GroupType.SINGLE:
    case GroupType.AND:
    case GroupType.OR: {
      const delimiter =
        group.type === GroupType.SINGLE ? null : group.type.valueOf();

      const entries = group.inner.map((item, idx) => {
        // string item = course id.
        if (typeof item === "string") {
          // TODO: source check
          const { isValid, source } = getCourseSource(
            item,
            termId,
            reqType,
            includeCurrentTerm,
          );

          // get the status: not planned or satisfied/unsatisfied
          const status = getTagStatus(source, isValid);

          // get the tooltip message corresponding to the status
          const tooltipMsg = getTagToolTip(source, isValid, lang);

          // render the course tag
          return (
            <Tag
              key={`${parentCourse}-${group.type}-${idx}-${item}`}
              sourceText={item}
              displayText={formatCourseId(item)}
              className={clsx(status, "clickable")}
              callback={(e, item) => addToCourseTakenOrJump(e, item, source)}
              tooltipOptions={{
                "data-tooltip-id": TooltipId.REQ_NOTES_TAG,
                "data-tooltip-content": tooltipMsg,
              }}
            />
          );
        } else {
          // nested group, recursively render it
          return (
            <ReqGroup
              key={`${parentCourse}-${group.type}-${idx}-${item.type.valueOf()}`}
              parentCourse={parentCourse}
              termId={termId}
              planId={planId}
              group={item}
              reqType={reqType}
              addToCourseTakenOrJump={addToCourseTakenOrJump}
              flexDirection={flexDirection === "row" ? "column" : "row"}
            />
          );
        }
      });

      // flatten and add delimiter between each item
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

    // pair group = 2 of the courses in the group must be taken
    case GroupType.PAIR: {
      // every is used for typing usage, can also use some
      if (!group.inner.every((i) => typeof i === "string")) {
        throw new Error("Pair group cannot contain non-string");
      }

      // add title to the group
      children.push(
        <span
          key={`${parentCourse}-${group.type.valueOf()}-title`}
          className="req-title"
        >
          TWO FROM:
        </span>,
      );

      // add course tags to the group
      group.inner.forEach((item, idx) => {
        const { isValid, source } = getCourseSource(
          item,
          termId,
          reqType,
          includeCurrentTerm,
        );

        // get the status: not planned or satisfied/unsatisfied
        const status = getTagStatus(source, isValid);

        // get the tooltip message corresponding to the status
        const tooltipMsg = getTagToolTip(source, isValid, lang);

        // render the course tag
        children.push(
          <Tag
            key={`${parentCourse}-${group.type}-${idx}-${item}`}
            sourceText={item}
            displayText={formatCourseId(item)}
            className={clsx(status, "clickable")}
            callback={(e, item) => addToCourseTakenOrJump(e, item, source)}
            tooltipOptions={{
              "data-tooltip-id": TooltipId.REQ_NOTES_TAG,
              "data-tooltip-content": tooltipMsg,
            }}
          />,
        );
      });

      break;
    }

    // very rare case, no need to over optimize for this case
    // there will be no nested cases
    // credit group = must take at least x credits from the following subjects
    case GroupType.CREDIT: {
      // every is used for typing usage, can also use some
      if (!group.inner.every((i) => typeof i === "string")) {
        throw new Error("Credit group cannot contain non-string");
      }

      // destructure the group inner
      const [req, scopes, ...subjects] = group.inner;

      // get the total credits and valid subject map
      const { totalCredits, validSubjectMap } = getValidCourses(
        new Set(subjects),
        scopes,
        termId,
        includeCurrentTerm,
      );

      // get the status: not planned or satisfied/unsatisfied
      const status =
        totalCredits >= parseFloat(req) ? "satisfied" : "unsatisfied";

      // get the levels: any, specific levels, or any level
      const levels =
        scopes[0] === "0"
          ? "=ANY"
          : scopes.length > 1
            ? `>=${scopes[0]}XX`
            : `=${scopes[0]}XX`;

      // add title to the group
      children.push(
        <span
          key={`${parentCourse}-${group.type.valueOf()}-title`}
          className="req-title"
        >
          AT LEAST <strong>{req}</strong> CREDITS FROM:
        </span>,
      );

      subjects.forEach((subject, idx) => {
        // TODO: group courss ids by location
        const subjectToolTipMap = Object.entries(
          validSubjectMap[subject]?.validCourses ?? {},
        ).reduce(
          (acc, val) => {
            const [courseId, { source, credits }] = val;
            if (!acc[source]) {
              acc[source] = [];
            }
            acc[source].push(`${formatCourseId(courseId)} (${credits})`);
            return acc;
          },
          {} as { [source: string]: string[] },
        );

        /**
         * tooltip html string
         *
         * each course is separated by a <br />
         * each source is separated by a <br /><br />
         */
        const tooltipHtml =
          Object.entries(subjectToolTipMap)
            .map(([source, courses]) => {
              return /* html */ `${source}: <br />${courses.join("<br />")}`;
            })
            .join(/* html */ `</br></br>`) || "No Valid Course";

        children.push(
          <Tag
            key={`${parentCourse}-${group.type}-${idx}-${subject}`}
            sourceText={subject}
            displayText={
              subject.toUpperCase() +
              levels +
              `(${validSubjectMap[subject]?.totalCredits ?? 0}/${req})`
            }
            className={clsx([
              validSubjectMap[subject]?.totalCredits > 0 && status,
            ])}
            tooltipOptions={{
              "data-tooltip-id": TooltipId.REQ_NOTES_TAG,
              "data-tooltip-html": tooltipHtml,
            }}
          />,
        );
      });

      break;
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
