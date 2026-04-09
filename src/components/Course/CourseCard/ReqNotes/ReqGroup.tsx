import { Tag } from "@/components/Common";
import { getTagStatus, getTagToolTip } from "@/lib/course";
import { ReqType, GroupType, TooltipId } from "@/lib/enums";
import { formatCourseId, formatLevelStr, joinWithBreaks } from "@/lib/utils";
import clsx from "clsx";
import type { CSSProperties, JSX } from "react";
import type { ReqGroup, SourcedReqGroup } from "@/types/local";
import { CONST_STR } from "@/lib/constants";
import type { Language } from "@/lib/i18n";
import { useAppStore } from "@/store/hooks";

/**
 * inner component to recursively render the requisites tags
 *
 * @param rootCourse - the root course id
 * @param group - the group that includes the requisites
 * @param flexDirection - the flex display direction of the group
 * @param reqType - the type of the requisites: pre, co, anti
 * @param addToCourseTakenOrJump - the function to add a course to the course taken or jump to the course card
 * @returns
 */
const ReqGroup = (args: {
  rootCourse: string;
  reqType: ReqType;
  group: SourcedReqGroup;
  lang: Language;
  addToCourseTakenOrJump: (
    e: React.MouseEvent<HTMLSpanElement>,
    courseId?: string,
    source?: string,
  ) => void;
  flexDirection?: CSSProperties["flexDirection"];
}) => {
  const {
    rootCourse,
    group,
    reqType,
    lang,
    addToCourseTakenOrJump,
    flexDirection = "row",
  } = args;

  const store = useAppStore();
  let children: JSX.Element[] = [];

  switch (group.type) {
    // empty group, no need to render
    case GroupType.EMPTY: {
      return null;
    }

    // simple group type with simple delimiter
    case GroupType.SINGLE:
    case GroupType.AND:
    case GroupType.OR: {
      // OR, AND
      const delimStr =
        group.type === GroupType.SINGLE ? null : group.type.valueOf();

      const entries = group.inner.map(
        (req: SourcedReqGroup | string, idx: number) => {
          // string item = course id.
          if (typeof req === "string") {
            const { isReqSat, source, equivId } = group.satMeta?.[req] ?? {};
            const displayId = equivId || req;
            const showEquiv = !!equivId;

            // get the status: not planned or satisfied/unsatisfied
            const status = getTagStatus(source, isReqSat);

            // get the tooltip message corresponding to the status
            const tooltipMsg = getTagToolTip({
              store,
              courseId: displayId,
              source,
              isValid: isReqSat,
              lang,
              isEquiv: showEquiv,
              reqType,
            });

            // render the course tag
            return (
              <Tag
                key={`${rootCourse}-${group.type}-${idx}-${req}`}
                sourceText={req}
                displayText={formatCourseId(req)}
                className={clsx(status, showEquiv && "equiv", "clickable")}
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
                {...args}
                key={`${rootCourse}-${group.type}-${idx}-${req.type.valueOf()}`}
                flexDirection={flexDirection === "row" ? "column" : "row"}
                group={req}
              />
            );
          }
        },
      );

      // flatten and add delimiter between each item
      children = entries.flatMap((item, idx) =>
        idx === 0
          ? [item]
          : [
              <span className="delimiter" key={`delimiter-${idx}`}>
                {delimStr}
              </span>,
              item,
            ],
      );

      break;
    }

    // pair group = 2 of the courses in the group must be taken
    case GroupType.PAIR: {
      // add title to the group
      children.push(
        <span
          key={`${rootCourse}-${group.type.valueOf()}-title`}
          className="req-title"
        >
          TWO FROM:
        </span>,
      );

      // add course tags to the group
      group.inner.forEach((req, idx) => {
        const { isReqSat, source, equivId } = group.satMeta?.[req] ?? {};
        const displayId = equivId || req;
        const showEquiv = !!equivId;

        // get the UI status: not planned or satisfied/unsatisfied
        const status = getTagStatus(source, isReqSat);

        // get the tooltip message corresponding to the status
        const tooltipMsg = getTagToolTip({
          store,
          courseId: displayId,
          source,
          isValid: isReqSat,
          lang,
          isEquiv: showEquiv,
          reqType,
        });

        // render the course tag
        children.push(
          <Tag
            key={`${rootCourse}-${group.type}-${idx}-${req}`}
            sourceText={displayId}
            displayText={formatCourseId(req)}
            className={clsx(status, showEquiv && "equiv", "clickable")}
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
      // destructure the group inner
      // const totalCredits = group.totalValidCr;
      const satSubjectMap = group.satSubjectMap;
      const isCreditSat = group.isSat;
      const [req, scopes, ...subjects] = group.inner;

      // get the status: not planned or satisfied/unsatisfied
      const status = isCreditSat ? "satisfied" : "unsatisfied";

      // get the levels: any, specific levels, or any level
      const levels = formatLevelStr(scopes);

      // add title to the group
      children.push(
        <span
          key={`${rootCourse}-${group.type.valueOf()}-title`}
          className="req-title"
        >
          AT LEAST <strong>{req}</strong> CREDITS FROM:
        </span>,
      );

      subjects.forEach((subject, idx) => {
        /**
         * tooltip html string
         *
         * each course is separated by a <br />
         * each source is separated by a <br /><br />
         */
        const subjectReqMeta = satSubjectMap[subject];
        const tooltipHtml = subjectReqMeta
          ? joinWithBreaks(subjectReqMeta.validCourseIds)
          : CONST_STR.EMPTY;
        const validCr = subjectReqMeta?.validCr ?? 0;

        children.push(
          <Tag
            key={`${rootCourse}-${group.type}-${idx}-${subject}`}
            sourceText={subject}
            displayText={subject.toUpperCase() + levels + `(${validCr}/${req})`}
            className={clsx(validCr > 0 && status)}
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
