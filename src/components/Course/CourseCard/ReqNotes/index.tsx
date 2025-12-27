"use client";

import { GroupType, ReqType } from "@/lib/enums";
import type { EnhancedRequisites } from "@/types/local";
import { useRef } from "react";
import clsx from "clsx";
import ReqGroup from "./ReqGroup";
import { useAddToCourseTakenOrJump } from "@/lib/hooks/course";
import ScrollWrapper from "./ScrollWrapper";

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

  const addToCourseTakenOrJump = useAddToCourseTakenOrJump();

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
          <ScrollWrapper reqGroupRef={reqGroupRef} reqNotesRef={reqNotesRef}>
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
          </ScrollWrapper>
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

export default ReqNotes;
