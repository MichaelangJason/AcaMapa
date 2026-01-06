"use client";

import { useAppSelector } from "@/store/hooks";
import type { Plan, Term } from "@/types/db";
import clsx from "clsx";
import ScrollBar from "../ScrollBar";
import { useRef } from "react";
import { formatCourseId } from "@/lib/utils";

const PlanPreview = ({
  planData,
  className,
  style,
}: {
  planData: {
    terms: Term[];
    plan: Plan;
  };
  className?: string;
  style?: React.CSSProperties;
}) => {
  const { terms, plan } = planData;
  const courseData = useAppSelector((state) => state.localData.courseData);

  const termsContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className={clsx("plan-preview", className)} style={style}>
      <header>{plan.name}</header>
      <div className="terms-container scrollbar-hidden" ref={termsContainerRef}>
        {terms.map((term, index) => (
          <div className="term-preview" key={"term-preview-" + index}>
            <span className="term-name">{term.name}</span>
            <div className="courses-container">
              {term.courseIds.map((courseId) => {
                const course = courseData[courseId];
                if (!course) {
                  return null;
                }
                return (
                  <div
                    className="course-preview"
                    key={"course-preview-" + courseId}
                  >
                    <span className="credits">{course.credits}</span>
                    <span className="id">{formatCourseId(course.id)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <ScrollBar
        targetContainerRef={termsContainerRef}
        direction="horizontal"
        bindScroll={(cb) => {
          if (!termsContainerRef.current) return;
          termsContainerRef.current.onscroll = cb;
        }}
        unbindScroll={() => {
          if (!termsContainerRef.current) return;
          termsContainerRef.current.onscroll = null;
        }}
      />
    </div>
  );
};

export default PlanPreview;
