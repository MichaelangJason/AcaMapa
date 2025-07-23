"use client";

import type { Term } from "@/types/db";
import type { CachedDetailedCourse, DropdownOption } from "@/types/local";
import HamburgerIcon from "@/public/icons/hamburger.svg";
import PlusIcon from "@/public/icons/plus.svg";
import clsx from "clsx";
import { useMemo, useState, memo, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import DetailedCourseCard from "../Course/CourseCard/DetailedCourseCard";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { DraggingType, TooltipId } from "@/lib/enums";
import {
  DropdownMenuWrapper,
  Section,
  type ItemProps,
} from "../Common/DropdownMenu";
import { renameTerm } from "@/store/slices/userDataSlice";
import { setSimpleModalInfo } from "@/store/slices/localDataSlice";

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
      data-tooltip-id={TooltipId.TOP}
      data-tooltip-content={isBefore ? "Add term before" : "Add term after"}
      data-tooltip-delay-show={500}
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
  const hasSelectedCourses = useAppSelector(
    (state) => state.global.hasSelectedCourses,
  );
  const isDragging = useAppSelector((state) => state.global.isDragging);
  const [isTermDMOpen, setIsTermDMOpen] = useState(false);
  const isSeekingCourse = useAppSelector(
    (state) => state.global.isSeekingCourse,
  );

  const dispatch = useAppDispatch();

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
      if (courses.length > 0) {
        dispatch(
          setSimpleModalInfo({
            isOpen: true,
            title: "Delete Term",
            description: `Are you sure you want to delete ${term.name}?\n\nThis action cannot be undone.`,
            confirmCb: () => deleteTerm(term._id.toString(), idx),
            closeCb: () => {},
          }),
        );
      } else {
        deleteTerm(term._id.toString(), idx);
      }
    };

    const handleRenameTerm = () => {
      dispatch(
        setSimpleModalInfo({
          isOpen: true,
          title: "Rename Term",
          description: "",
          previousValue: term.name,
          confirmCb: (newName?: string) => {
            if (!newName) return;
            dispatch(renameTerm({ termId: term._id.toString(), newName }));
          },
          closeCb: () => {},
        }),
      );
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
      {
        self: {
          id: "rename-term",
          content: "Rename",
          handleClick: handleRenameTerm,
          isHideIndicator: true,
          isHideFiller: true,
        } as DropdownOption,
        handleCloseDropdownMenu: handleCloseTermDM,
      },
    ];
  }, [deleteTerm, idx, handleCloseTermDM, term, dispatch, courses]);

  return (
    // outer draggable for the whole term card
    <Draggable draggableId={term._id} index={idx} isDragDisabled={false}>
      {(draggableProvided, draggableSnapshot) => (
        // inner div for the whole term card
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
          {/* header for the term card */}
          <header
            className="term-header"
            {...draggableProvided.dragHandleProps}
          >
            {hasSelectedCourses ? (
              <button className="add-course-button" onClick={handleAddCourse}>
                Add to {term.name}
              </button>
            ) : (
              <span>{term.name}</span>
            )}
            {/* dropdown menu for the term card */}
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
          {/* droppable for the courses in the term card */}
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
                {/* draggable for the courses in the term card */}
                {courses.map((course, idx) => (
                  <Draggable
                    key={`draggable-${term._id}-${course.id}-${idx}`}
                    draggableId={course.id}
                    index={idx}
                    isDragDisabled={isSeekingCourse}
                  >
                    {(courseDraggableProvided, courseDraggableSnapshot) => (
                      <DetailedCourseCard
                        key={`${term._id}-${course.id}-${idx}`}
                        course={course}
                        idx={idx}
                        termId={term._id}
                        handleDelete={handleDeleteCourse}
                        setIsExpanded={setIsCourseExpanded}
                        isDraggingTerm={draggableSnapshot.isDragging}
                        draggableProvided={courseDraggableProvided}
                        draggableSnapshot={courseDraggableSnapshot}
                      />
                    )}
                  </Draggable>
                ))}
                {droppableProvided.placeholder}
              </main>
            )}
          </Droppable>
          {/* footer for the term card */}
          <footer className="term-footer">
            <span>{totalCredits} credits</span>
          </footer>

          {/* add term button for the term card */}
          {!isDragging && (
            <AddTermButton isBefore={false} onClick={handleAddTerm} />
          )}
        </div>
      )}
    </Draggable>
  );
};

export default memo(TermCard);
