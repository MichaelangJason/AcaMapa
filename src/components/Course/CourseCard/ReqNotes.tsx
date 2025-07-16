import { GroupType, ReqType } from "@/lib/enums";
import { Tag } from "@/components/Common";
import { formatCourseId } from "@/lib/utils";
import type { EnhancedRequisites, ReqGroup } from "@/types/local";
import type { CSSProperties, JSX } from "react";
import { useAppSelector } from "@/store/hooks";
import { selectCourseDepMeta } from "@/store/selectors";

const ReqNotes = ({
  parentCourse,
  title,
  requisites,
  notes = [],
  termId,
  includeCurrentTerm = false,
  type,
}: {
  parentCourse: string;
  title: string;
  type: ReqType;
  requisites?: EnhancedRequisites;
  notes?: string[];
  termId: string;
  includeCurrentTerm?: boolean;
}) => {
  return (
    <div className="req-note">
      <header>{title}:</header>
      {requisites?.group && (
        <ReqGroup
          parentCourse={parentCourse}
          group={requisites.group}
          isOuterGroup={true}
          includeCurrentTerm={includeCurrentTerm}
          termId={termId}
          reqType={type}
        />
      )}
      <ul className="notes">
        {requisites?.raw && <li>{requisites.raw}</li>}
        {notes.map((note, idx) => (
          <li key={idx}>{note}</li>
        ))}
      </ul>
    </div>
  );
};

const ReqGroup = ({
  parentCourse,
  group,
  flexDirection = "row",
  isOuterGroup = false,
  includeCurrentTerm = false,
  termId,
  reqType,
}: {
  parentCourse: string;
  group: ReqGroup;
  flexDirection?: CSSProperties["flexDirection"];
  isOuterGroup?: boolean;
  includeCurrentTerm?: boolean;
  termId: string;
  reqType: ReqType;
}) => {
  let children: JSX.Element[] = [];
  const { getCourseSource, getValidCourses } =
    useAppSelector(selectCourseDepMeta);

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
            includeCurrentTerm,
          );
          const status =
            source === ""
              ? undefined
              : reqType !== ReqType.ANTI_REQ && isValid
                ? "satisfied"
                : "unsatisfied";

          if (source) {
            console.log(isValid, source);
          }

          return (
            <Tag
              key={`${parentCourse}-${group.type}-${idx}-${item}`}
              sourceText={item}
              displayText={formatCourseId(item)}
              className={status}
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
          includeCurrentTerm,
        );
        const status =
          source === ""
            ? undefined
            : reqType !== ReqType.ANTI_REQ && isValid
              ? "satisfied"
              : "unsatisfied";
        return (
          <Tag
            key={`${parentCourse}-${group.type}-${idx}-${item}`}
            sourceText={item}
            displayText={formatCourseId(item)}
            className={status}
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
      const status = totalCredits >= parseFloat(req) ? "satisfied" : undefined;

      const levels =
        scopes[0] === "0"
          ? "-ANY"
          : scopes.length > 1
            ? `>=${scopes[0]}XX`
            : `-${scopes[0]}XX`;

      children = subjects.map((subject, idx) => (
        <Tag
          key={`${parentCourse}-${group.type}-${idx}-${subject}`}
          sourceText={subject}
          displayText={
            subject.toUpperCase() +
            levels +
            `(${validSubjectMap[subject]?.totalCredits ?? 0})`
          }
          className={status}
        />
      ));

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
      className="req-group scrollbar-hidden"
      style={{
        flexDirection: [GroupType.PAIR, GroupType.CREDIT].includes(group.type)
          ? "column"
          : flexDirection,
        width: isOuterGroup ? "100%" : "fit-content",
        overflow: isOuterGroup ? "scroll" : "visible",
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
