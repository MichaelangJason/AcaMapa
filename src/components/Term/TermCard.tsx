"use client";

import type { Term } from "@/types/db";
import type { CachedDetailedCourse, DropdownOption } from "@/types/local";
import HamburgerIcon from "@/public/icons/hamburger.svg";
import PlusIcon from "@/public/icons/plus.svg";
import EditIcon from "@/public/icons/edit.svg";
import clsx from "clsx";
import { useMemo, useState, memo, useCallback, useRef, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import DetailedCourseCard from "../Course/CourseCard/DetailedCourseCard";
import {
  Draggable,
  DraggableStateSnapshot,
  DraggableProvided,
  DroppableProvided,
  DroppableStateSnapshot,
} from "@hello-pangea/dnd";
import { TooltipId } from "@/lib/enums";
import {
  DropdownMenuWrapper,
  Section,
  type ItemProps,
} from "../Common/DropdownMenu";
import { renameTerm } from "@/store/slices/userDataSlice";
import { setSimpleModalInfo } from "@/store/slices/localDataSlice";
import { MAX_TERM_NAME_LEN } from "@/lib/constants";
import { I18nKey, Language, t } from "@/lib/i18n";
import ScrollBar from "../Common/ScrollBar";

const AddTermButton = ({
  isBefore,
  onClick,
}: {
  isBefore: boolean;
  onClick: (isBefore: boolean) => void;
}) => {
  const [isClicked, setIsClicked] = useState(false);
  const lang = useAppSelector((state) => state.userData.lang) as Language;

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
      data-tooltip-id={TooltipId.TERM_CARD}
      data-tooltip-content={t(
        [
          I18nKey.ADD,
          I18nKey.ONE_M,
          I18nKey.NEW_M,
          I18nKey.SEMESTER,
          I18nKey.HERE,
        ],
        lang,
      )}
      data-tooltip-delay-show={500}
    >
      <PlusIcon />
    </button>
  );
};

const TermCard = ({
  planId,
  term,
  courses,
  idx,
  isFirst,
  isExport,
  isCourseDraggable = true,
  displayLang,
  showButtons = true,
  addCourse,
  addTerm,
  deleteTerm,
  deleteCourse,
  setIsCourseExpanded,
  className,
  style,
  draggableProvided,
  draggableSnapshot,
  droppableProvided,
  droppableSnapshot,
  expandCourses,
}: {
  planId: string;
  term: Term;
  courses: CachedDetailedCourse[];
  idx: number;
  isFirst: boolean;
  isExport?: boolean;
  isCourseDraggable: boolean;
  displayLang?: Language;
  showButtons: boolean;
  addTerm?: (termId: string, isBefore?: boolean) => void;
  deleteTerm?: (termId: string, termIdx: number) => void;
  addCourse?: (termId: string) => Promise<void>;
  deleteCourse?: (termId: string, courseId: string) => void;
  setIsCourseExpanded?: (courseId: string, isExpanded: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
  isDraggingOverlay?: boolean;
  draggableProvided?: DraggableProvided;
  draggableSnapshot?: DraggableStateSnapshot;
  droppableProvided?: DroppableProvided;
  droppableSnapshot?: DroppableStateSnapshot;
  expandCourses?: boolean;
}) => {
  const hasSelectedCourses = useAppSelector(
    (state) => state.global.hasSelectedCourses,
  );
  const isDragging = useAppSelector((state) => state.global.isDragging);
  const [isTermDMOpen, setIsTermDMOpen] = useState(false);
  const isSeekingCourse = useAppSelector(
    (state) => state.global.isSeekingCourse,
  );
  const userLang = useAppSelector((state) => state.userData.lang) as Language;
  const lang = displayLang || userLang;
  const termBodyRef = useRef<HTMLDivElement>(null);
  const termContainerRef = useRef<HTMLDivElement>(null);

  const dispatch = useAppDispatch();

  const totalCredits = useMemo(() => {
    return courses.reduce((acc, course) => acc + course.credits, 0);
  }, [courses]);

  const scrollCb = useCallback((e: WheelEvent) => {
    // console.log(e)
    if (!termBodyRef.current || Math.abs(e.deltaY) < 5) {
      return;
    }
    const termBody = termBodyRef.current;
    const scrollAmount = e.deltaY;
    const prevScrollTop = termBody.scrollTop;
    const containerMaxScrollLeft =
      termBody.scrollHeight - termBody.clientHeight;

    // Only stop propagation if there is actually something to scroll
    if (
      (scrollAmount < 0 && prevScrollTop > 0) ||
      (scrollAmount > 0 && prevScrollTop < containerMaxScrollLeft)
    ) {
      e.stopPropagation();
      e.preventDefault();
      termBody.scrollTop = prevScrollTop + scrollAmount;
    }
  }, []);

  useEffect(() => {
    if (!termContainerRef.current) return;
    termContainerRef.current.addEventListener("wheel", scrollCb);
    return () => {
      termContainerRef.current?.removeEventListener("wheel", scrollCb);
    };
  }, [scrollCb]);

  const handleAddCourse = useCallback(async () => {
    await addCourse?.(term._id.toString());
  }, [addCourse, term._id]);

  const handleDeleteCourse = useCallback(
    (courseId: string) => {
      deleteCourse?.(term._id.toString(), courseId);
    },
    [deleteCourse, term._id],
  );

  const handleAddTerm = useCallback(
    (isBefore: boolean) => {
      addTerm?.(term._id.toString(), isBefore);
    },
    [addTerm, term._id],
  );

  const handleCloseTermDM = useCallback(() => {
    setIsTermDMOpen(false);
  }, []);

  const handleDeleteTerm = useCallback(() => {
    if (courses.length > 0) {
      dispatch(
        setSimpleModalInfo({
          isOpen: true,
          title: t([I18nKey.DELETE_TERM_TITLE], lang),
          description: t([I18nKey.DELETE_TERM_DESC], lang, {
            item1: term.name,
          }),
          confirmCb: () => {
            deleteTerm?.(term._id.toString(), idx);
            return Promise.resolve();
          },
          closeCb: () => {
            return Promise.resolve();
          },
        }),
      );
    } else {
      deleteTerm?.(term._id.toString(), idx);
    }
  }, [deleteTerm, idx, dispatch, term, courses.length, lang]);

  const handleRenameTerm = useCallback(() => {
    dispatch(
      setSimpleModalInfo({
        isOpen: true,
        title: t([I18nKey.RENAME_TERM_TITLE], lang),
        description: "",
        inputConfig: {
          placeholder: term.name,
          maxLength: MAX_TERM_NAME_LEN,
        },
        confirmCb: (newName?: string) => {
          if (!newName) return Promise.resolve();
          dispatch(renameTerm({ termId: term._id.toString(), newName }));
          return Promise.resolve();
        },
        closeCb: () => {
          return Promise.resolve();
        },
      }),
    );
  }, [dispatch, term, lang]);

  const termActions: ItemProps[] = useMemo(() => {
    return [
      {
        self: {
          id: "delete-term",
          content: t([I18nKey.DELETE], lang),
          handleClick: handleDeleteTerm,
          isHideIndicator: true,
          isHideFiller: true,
        } as DropdownOption,
        handleCloseDropdownMenu: handleCloseTermDM,
      },
      {
        self: {
          id: "rename-term",
          content: t([I18nKey.RENAME], lang),
          handleClick: handleRenameTerm,
          isHideIndicator: true,
          isHideFiller: true,
        } as DropdownOption,
        handleCloseDropdownMenu: handleCloseTermDM,
      },
    ];
  }, [handleCloseTermDM, lang, handleDeleteTerm, handleRenameTerm]);

  const isDraggingTerm = draggableSnapshot?.isDragging;

  return (
    // outer draggable for the whole term card
    // inner div for the whole term card
    <article
      className={clsx(["term-card", className, isDraggingTerm && "dragging"])}
      style={style}
      ref={draggableProvided?.innerRef}
      {...draggableProvided?.draggableProps}
    >
      {!isDragging && isFirst && showButtons && (
        <AddTermButton isBefore={true} onClick={handleAddTerm} />
      )}

      {/* header for the term card */}
      <header className="term-header" {...draggableProvided?.dragHandleProps}>
        {/* add course button for the term card */}
        {hasSelectedCourses && showButtons ? (
          <button className="add-course-button" onClick={handleAddCourse}>
            {t([I18nKey.ADD_TO], lang, { item1: term.name })}
          </button>
        ) : (
          <span className="term-name-container">
            <span className="term-name">{term.name}</span>
            <EditIcon
              className={clsx([
                "edit",
                "clickable",
                (isSeekingCourse ||
                  hasSelectedCourses ||
                  isDragging ||
                  !showButtons) &&
                  "hidden",
              ])}
              onClick={handleRenameTerm}
            />
          </span>
        )}
        {/* dropdown menu for the term card */}
        {showButtons && (
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
        )}
      </header>

      <div
        className={clsx([
          "term-body-container",
          "scrollbar-hidden",
          isSeekingCourse && "scroll-disabled",
        ])}
        ref={termContainerRef}
      >
        {/* droppable for the courses in the term card */}
        <main
          className={clsx([
            "term-body",
            "scrollbar-hidden",
            droppableSnapshot?.isDraggingOver && "dragging-over",
          ])}
          ref={(el) => {
            droppableProvided?.innerRef(el);
            termBodyRef.current = el as HTMLDivElement;
          }}
          {...droppableProvided?.droppableProps}
        >
          {courses.map((course, idx) =>
            isCourseDraggable ? (
              // draggable for the courses in the term card
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
                    planId={planId}
                    handleDelete={handleDeleteCourse}
                    setIsExpanded={setIsCourseExpanded}
                    isDraggingTerm={isDraggingTerm ?? false}
                    draggableProvided={courseDraggableProvided}
                    draggableSnapshot={courseDraggableSnapshot}
                    isExport={isExport}
                    expandCourses={expandCourses}
                  />
                )}
              </Draggable>
            ) : (
              // non-draggable for the courses in the term card
              <DetailedCourseCard
                key={`${term._id}-${course.id}-${idx}`}
                course={course}
                idx={idx}
                termId={term._id}
                planId={planId}
                handleDelete={handleDeleteCourse}
                setIsExpanded={setIsCourseExpanded}
                isDraggingTerm={isDraggingTerm ?? false}
                isExport={isExport}
                expandCourses={expandCourses}
              />
            ),
          )}
          {isExport && courses.length === 0 && (
            <div className="empty-term">
              <span>{t([I18nKey.EMPTY], lang)}</span>
            </div>
          )}
          {!isExport && droppableProvided?.placeholder}
        </main>
        <ScrollBar
          targetContainerRef={termBodyRef}
          direction="vertical"
          bindScroll={(cb) => {
            if (!termBodyRef.current) return;
            termBodyRef.current.addEventListener("scroll", cb);
          }}
          unbindScroll={(cb) => {
            if (!termBodyRef.current) return;
            termBodyRef.current.removeEventListener("scroll", cb);
          }}
        />
      </div>

      {/* footer for the term card */}
      <footer className="term-footer">
        <span>
          {totalCredits} {t([I18nKey.CREDITS], lang)}
        </span>
      </footer>

      {/* add term button for the term card */}
      {!isDragging && showButtons && (
        <AddTermButton isBefore={false} onClick={handleAddTerm} />
      )}
    </article>
  );
};

export default memo(TermCard);
