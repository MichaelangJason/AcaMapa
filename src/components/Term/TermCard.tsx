"use client";

import type { Term } from "@/types/db";
import type { CachedDetailedCourse, DropdownOption } from "@/types/local";
import HamburgerIcon from "@/public/icons/hamburger.svg";
import PlusIcon from "@/public/icons/plus.svg";
import clsx from "clsx";
import { useMemo, useState, memo, useCallback } from "react";
import { useAppSelector } from "@/store/hooks";
import DetailedCourseCard from "../Course/CourseCard/DetailedCourseCard";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { DraggingType } from "@/lib/enums";
import {
  DropdownMenuWrapper,
  Section,
  type ItemProps,
} from "../Common/DropdownMenu";

const AddTermButton = ({
  isBefore,
  onClick,
}: {
  isBefore: boolean;
  onClick: (isBefore: boolean) => void;
}) => {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = useCallback(() => {
    setIsClicked(true);
    onClick(isBefore);
    setTimeout(() => {
      setIsClicked(false);
    }, 100);
  }, [isBefore, onClick]);

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
  const [isTermDMOpen, setIsTermDMOpen] = useState(false);
  const isSeekingCourse = useAppSelector(
    (state) => state.global.isSeekingCourse,
  );

  const totalCredits = useMemo(() => {
    return courses.reduce((acc, course) => acc + course.credits, 0);
  }, [courses]);

  const handleAddCourse = useCallback(async () => {
    await addCourse(term._id.toString());
  }, [addCourse, term._id]);

  const handleDeleteCourse = useCallback(
    (courseId: string) => {
      deleteCourse(term._id.toString(), courseId);
    },
    [deleteCourse, term._id],
  );

  const handleAddTerm = useCallback(
    (isBefore: boolean) => {
      addTerm(term._id.toString(), isBefore);
    },
    [addTerm, term._id],
  );

  const handleCloseTermDM = useCallback(() => {
    setIsTermDMOpen(false);
  }, []);

  const termActions: ItemProps[] = useMemo(() => {
    const handleDeleteTerm = () => {
      deleteTerm(term._id.toString(), idx);
    };

    return [
      {
        self: {
          id: "delete-term",
          content: "Delete",
          handleClick: handleDeleteTerm,
          isHideIndicator: true,
          isHideFiller: true,
        } as DropdownOption,
        handleCloseDropdownMenu: handleCloseTermDM,
      },
    ];
  }, [deleteTerm, idx, handleCloseTermDM, term._id]);

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
            <DropdownMenuWrapper
              isOpen={isTermDMOpen}
              handleClose={() => setIsTermDMOpen(false)}
              trigger={{
                node: <HamburgerIcon className="hamburger" />,
                toggleIsOpen: () => setIsTermDMOpen((prev) => !prev),
              }}
              contentProps={{
                align: "center",
              }}
            >
              <Section
                items={termActions}
                handleCloseDropdownMenu={handleCloseTermDM}
              />
            </DropdownMenuWrapper>
          </header>
          <Droppable droppableId={term._id} type={DraggingType.COURSE}>
            {(droppableProvided, droppableSnapshot) => (
              <main
                className={clsx([
                  "term-body",
                  "scrollbar-custom",
                  droppableSnapshot.isDraggingOver && "dragging-over",
                  isSeekingCourse && "scroll-disabled",
                ])}
                ref={droppableProvided.innerRef}
                {...droppableProvided.droppableProps}
              >
                {courses.map((course, idx) => (
                  <DetailedCourseCard
                    key={`${term._id}-${course.id}-${idx}`}
                    course={course}
                    idx={idx}
                    termId={term._id}
                    handleDelete={handleDeleteCourse}
                    setIsExpanded={setIsCourseExpanded}
                    isDragging={draggableSnapshot.isDragging}
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
