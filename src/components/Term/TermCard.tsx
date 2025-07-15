"use client";

import type { Term } from "@/types/db";
import type { CachedDetailedCourse } from "@/types/local";
import HamburgerIcon from "@/public/hamburger.svg";
import PlusIcon from "@/public/icons/plus.svg";
import clsx from "clsx";
import { useMemo, useState, memo } from "react";
import { useAppSelector } from "@/store/hooks";
import DetailedCourseCard from "../Course/CourseCard/DetailedCourseCard";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { DraggingType } from "@/lib/enums";

const AddTermButton = ({
  isBefore,
  onClick,
}: {
  isBefore: boolean;
  onClick: (isBefore: boolean) => void;
}) => {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    onClick(isBefore);
    setTimeout(() => {
      setIsClicked(false);
    }, 100);
  };
  return (
    <button
      className={clsx([
        "add-term-button",
        isBefore && "on-left",
        isClicked && "clicked",
      ])}
      onClick={handleClick}
    >
      <PlusIcon />
    </button>
  );
};

const TermCard = ({
  term,
  courses,
  idx,
  isFirst,
  addCourse,
  addTerm,
  deleteTerm,
  deleteCourse,
  setIsCourseExpanded,
  style,
}: {
  term: Term;
  courses: CachedDetailedCourse[];
  idx: number;
  isFirst: boolean;
  addTerm: (termId: string, isBefore?: boolean) => void;
  deleteTerm: (termId: string, termIdx: number) => void;
  addCourse: (termId: string) => Promise<void>;
  deleteCourse: (termId: string, courseId: string) => void;
  setIsCourseExpanded: (courseId: string, isExpanded: boolean) => void;
  style?: React.CSSProperties;
  isDraggingOverlay?: boolean;
}) => {
  const isAddingCourse = useAppSelector((state) => state.global.isAddingCourse);
  const isDragging = useAppSelector((state) => state.global.isDragging);

  const totalCredits = useMemo(() => {
    return courses.reduce((acc, course) => acc + course.credits, 0);
  }, [courses]);

  const handleAddCourse = async () => {
    await addCourse(term._id.toString());
  };

  const handleDeleteCourse = (courseId: string) => {
    deleteCourse(term._id.toString(), courseId);
  };

  const handleAddTerm = (isBefore: boolean) => {
    addTerm(term._id.toString(), isBefore);
  };

  return (
    <Draggable draggableId={term._id} index={idx} isDragDisabled={false}>
      {(draggableProvided, draggableSnapshot) => (
        <div
          className={clsx([
            "term-card",
            draggableSnapshot.isDragging && "dragging",
          ])}
          style={style}
          ref={draggableProvided.innerRef}
          {...draggableProvided.draggableProps}
        >
          {!isDragging && isFirst && (
            <AddTermButton isBefore={true} onClick={handleAddTerm} />
          )}
          <header
            className="term-header"
            {...draggableProvided.dragHandleProps}
          >
            {isAddingCourse ? (
              <button className="add-course-button" onClick={handleAddCourse}>
                Add to {term.name}
              </button>
            ) : (
              <span>{term.name}</span>
            )}
            <HamburgerIcon onClick={() => deleteTerm(term._id, idx)} />
          </header>
          <Droppable droppableId={term._id} type={DraggingType.COURSE}>
            {(droppableProvided, droppableSnapshot) => (
              <main
                className={clsx([
                  "term-body",
                  "scrollbar-custom",
                  droppableSnapshot.isDraggingOver && "dragging-over",
                ])}
                ref={droppableProvided.innerRef}
                {...droppableProvided.droppableProps}
              >
                {courses.map((course, idx) => (
                  <DetailedCourseCard
                    key={`${term._id}-${course.id}-${idx}`}
                    course={course}
                    idx={idx}
                    handleDelete={handleDeleteCourse}
                    setIsExpanded={setIsCourseExpanded}
                  />
                ))}
                {droppableProvided.placeholder}
              </main>
            )}
          </Droppable>
          <footer className="term-footer">
            <span>{totalCredits} credits</span>
          </footer>

          {!isDragging && (
            <AddTermButton isBefore={false} onClick={handleAddTerm} />
          )}
        </div>
      )}
    </Draggable>
  );
};

export default memo(TermCard);
