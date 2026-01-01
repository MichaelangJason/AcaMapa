import { Tag } from "@/components/Common";
import { getTagStatus, getTagToolTip } from "@/lib/course";
import { ReqType, GroupType, TooltipId } from "@/lib/enums";
import { Language } from "@/lib/i18n";
import { formatCourseId } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";
import { selectCourseDepMeta } from "@/store/selectors";
import clsx from "clsx";
import type { CSSProperties, JSX } from "react";
import type { ReqGroup } from "@/types/local";

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
          const { courseId, isValid, source, isEquiv } = getCourseSource(
            item,
            termId,
            reqType,
            includeCurrentTerm,
          );

          // get the status: not planned or satisfied/unsatisfied
          const status = getTagStatus(source, isValid);

          // get the tooltip message corresponding to the status
          const tooltipMsg = getTagToolTip(
            courseId,
            source,
            isValid,
            lang,
            isEquiv,
          );

          // render the course tag
          return (
            <Tag
              key={`${parentCourse}-${group.type}-${idx}-${item}`}
              sourceText={courseId}
              displayText={formatCourseId(item)}
              className={clsx(status, isEquiv && "equiv", "clickable")}
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
        const { courseId, isValid, source, isEquiv } = getCourseSource(
          item,
          termId,
          reqType,
          includeCurrentTerm,
        );

        // get the status: not planned or satisfied/unsatisfied
        const status = getTagStatus(source, isValid);

        // get the tooltip message corresponding to the status
        const tooltipMsg = getTagToolTip(
          courseId,
          source,
          isValid,
          lang,
          isEquiv,
        );

        // render the course tag
        children.push(
          <Tag
            key={`${parentCourse}-${group.type}-${idx}-${item}`}
            sourceText={courseId}
            displayText={formatCourseId(item)}
            className={clsx(status, isEquiv && "equiv", "clickable")}
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

export default ReqGroup;
