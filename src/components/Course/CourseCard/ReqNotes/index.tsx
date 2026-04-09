"use client";

import { GroupType, ReqType } from "@/lib/enums";
import type { SourcedReqGroup } from "@/types/local";
import { useRef } from "react";
import clsx from "clsx";
import ReqGroup from "./ReqGroup";
import { useAddToCourseTakenOrJump } from "@/lib/hooks/course";
import ScrollWrapper from "./ScrollWrapper";
import { useAppSelector } from "@/store/hooks";

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
  sourcedReqGroup,
  reqText,
  notes = [],
  type,
}: {
  parentCourse?: string;
  title: string;
  type: ReqType;
  reqText?: string;
  sourcedReqGroup?: SourcedReqGroup;
  notes?: string[];
}) => {
  const reqNotesRef = useRef<HTMLDivElement>(null);
  const reqGroupRef = useRef<HTMLDivElement>(null);

  const addToCourseTakenOrJump = useAddToCourseTakenOrJump();
  const lang = useAppSelector((state) => state.userData.lang);

  const hasReq = sourcedReqGroup && sourcedReqGroup.type !== GroupType.EMPTY;
  const showReqGroup = hasReq && parentCourse; // unsafe validity check

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
              lang={lang}
              rootCourse={parentCourse}
              group={sourcedReqGroup}
              reqType={type}
              addToCourseTakenOrJump={addToCourseTakenOrJump}
            />
          </ScrollWrapper>
        </section>
      )}

      {/* notes */}
      <ul className="notes">
        {reqText && <li>{reqText}</li>}
        {notes.map((note, idx) => (
          <li key={`note-${parentCourse}-${type}-${idx}`}>{note}</li>
        ))}
      </ul>
    </section>
  );
};

export default ReqNotes;
