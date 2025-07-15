import { GroupType } from "@/lib/enums";
import { Tag } from "@/components/Common";
import { formatCourseId } from "@/lib/utils";
import type { EnhancedRequisites, ReqGroup } from "@/types/local";
import type { CSSProperties, JSX } from "react";

const ReqNotes = ({
  parentCourse,
  title,
  requisites,
  notes = [],
}: {
  parentCourse: string;
  title: string;
  requisites?: EnhancedRequisites;
  notes?: string[];
}) => {
  return (
    <div className="req-note">
      <header>{title}:</header>
      {requisites?.group && (
        <ReqGroup
          parentCourse={parentCourse}
          group={requisites.group}
          isOuterGroup={true}
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
}: {
  parentCourse: string;
  group: ReqGroup;
  flexDirection?: CSSProperties["flexDirection"];
  isOuterGroup?: boolean;
}) => {
  let children: JSX.Element[] = [];

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
          return (
            <Tag
              key={`${parentCourse}-${group.type}-${idx}-${item}`}
              sourceText={item}
              displayText={formatCourseId(item)}
            />
          );
        } else {
          return (
            <ReqGroup
              key={`${parentCourse}-${group.type}-${idx}-${item.type.valueOf()}`}
              parentCourse={parentCourse}
              group={item}
              flexDirection={flexDirection === "row" ? "column" : "row"}
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

      children = group.inner.map((item, idx) => (
        <Tag
          key={`${parentCourse}-${group.type}-${idx}-${item}`}
          sourceText={item}
          displayText={formatCourseId(item)}
        />
      ));

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
    case GroupType.CREDIT: {
      // every is used for typing usage, can also use some
      if (!group.inner.every((i) => typeof i === "string")) {
        throw new Error("Credit group cannot contain non-string");
      }

      const [req, scopes, ...subjects] = group.inner;

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
          displayText={subject.toUpperCase() + levels + `(${0})`}
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
