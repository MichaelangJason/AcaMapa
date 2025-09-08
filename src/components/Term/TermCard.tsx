"use client";

import type { Term } from "@/types/db";
import type { CachedDetailedCourse, DropdownOption } from "@/types/local";
import HamburgerIcon from "@/public/icons/hamburger.svg";
import PlusIcon from "@/public/icons/plus.svg";
import SelectIcon from "@/public/icons/select.svg";
import clsx from "clsx";
import {
  useMemo,
  useState,
  memo,
  useCallback,
  useRef,
  useEffect,
  startTransition,
} from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import DetailedCourseCard from "../Course/CourseCard/DetailedCourseCard";
import {
  Draggable,
  DraggableStateSnapshot,
  DraggableProvided,
  DroppableProvided,
  DroppableStateSnapshot,
} from "@hello-pangea/dnd";
import { Season, TooltipId } from "@/lib/enums";
import {
  DropdownMenuWrapper,
  Section,
  type ItemProps,
} from "../Common/DropdownMenu";
import { renameTerm } from "@/store/slices/userDataSlice";
import { setSimpleModalInfo } from "@/store/slices/localDataSlice";
import {
  CURR_ACADEMIC_YEAR_RANGE,
  CURR_YEAR_RANGE_STRING,
} from "@/lib/constants";
import { I18nKey, Language, t } from "@/lib/i18n";
import WinterIcon from "@/public/icons/winter.svg";
import SummerIcon from "@/public/icons/summer.svg";
import FallIcon from "@/public/icons/fall.svg";
import NotOfferedIcon from "@/public/icons/not-offered.svg";
import TriangleIcon from "@/public/icons/triangle.svg";
import CircleIcon from "@/public/icons/indicator.svg";
import ScrollBar from "../Common/ScrollBar";
import { mockTermNames } from "@/lib/mock";
import { isValidTermName } from "@/lib/typeGuards";
import { isCurrentTerm, isThisYearTerm, openInVSB } from "@/lib/term";

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
        [I18nKey.ADD, I18nKey.NEW_M, I18nKey.SEMESTER],
        lang,
      )}
      data-tooltip-delay-show={500}
    >
      <PlusIcon />
    </button>
  );
};

const mapSeason = (termSeason: Season) => {
  if (termSeason === Season.WINTER) {
    return <WinterIcon className="term-season-icon" />;
  } else if (termSeason === Season.SUMMER) {
    return <SummerIcon className="term-season-icon" />;
  } else if (termSeason === Season.FALL) {
    return <FallIcon className="term-season-icon" />;
  }
  return <NotOfferedIcon className="term-season-icon" />;
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
  const selectRef = useRef<HTMLSelectElement>(null);
  const termSeason = useMemo(() => {
    const normalizedTermName = term.name.toLowerCase();
    if (
      Object.values(Language).some((l) =>
        normalizedTermName.includes(t([I18nKey.WINTER], l).toLowerCase()),
      )
    ) {
      return Season.WINTER;
    } else if (
      Object.values(Language).some((l) =>
        normalizedTermName.includes(t([I18nKey.SUMMER], l).toLowerCase()),
      )
    ) {
      return Season.SUMMER;
    } else if (
      Object.values(Language).some((l) =>
        normalizedTermName.includes(t([I18nKey.FALL], l).toLowerCase()),
      )
    ) {
      return Season.FALL;
    }
    return Season.NOT_OFFERED;
  }, [term]);
  const [isEditing, setIsEditing] = useState(false);
  const isCurrTerm = useMemo(() => isCurrentTerm(term.name), [term.name]);
  const isCurrYearTerm = useMemo(() => isThisYearTerm(term.name), [term.name]);

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
      // e.preventDefault();
      termBody.scrollTop = prevScrollTop + scrollAmount;
    }
  }, []);

  useEffect(() => {
    if (!termContainerRef.current) return;
    termContainerRef.current.addEventListener("wheel", scrollCb, {
      passive: true,
    });
    const elem = termContainerRef.current;
    return () => {
      elem?.removeEventListener("wheel", scrollCb);
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

  const handleOpenInVSB = useCallback(() => {
    openInVSB(
      term.name,
      courses.map((course) => course.id),
    );
  }, [term.name, courses]);

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
          id: "open-in-vsb",
          content: t([I18nKey.OPEN_IN_VSB], lang),
          isDisabled: !isCurrYearTerm,
          handleClick: handleOpenInVSB,
          isHideIndicator: true,
          isHideFiller: true,
        } as DropdownOption,
        handleCloseDropdownMenu: handleCloseTermDM,
      },
    ];
  }, [
    handleCloseTermDM,
    lang,
    handleDeleteTerm,
    handleOpenInVSB,
    isCurrYearTerm,
  ]);

  useEffect(() => {
    if (isEditing && selectRef.current) {
      selectRef.current.focus();
      selectRef.current.showPicker();
    }
  }, [isEditing]);

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
      {!isDragging &&
        (isCurrTerm ? (
          <TriangleIcon
            className={clsx(["indicator", isCurrTerm && "current"])}
            data-tooltip-id={TooltipId.SEASON_INDICATOR}
            data-tooltip-content={t([I18nKey.CURRENT_TERM], lang)}
            data-tooltip-delay-show={200}
          />
        ) : isCurrYearTerm ? (
          <CircleIcon
            className={clsx(["indicator"])}
            data-tooltip-id={TooltipId.SEASON_INDICATOR}
            data-tooltip-content={t([I18nKey.CURRENT_YEAR_TERM], lang, {
              item1: CURR_YEAR_RANGE_STRING,
            })}
            data-tooltip-delay-show={200}
          />
        ) : null)}

      {/* header for the term card */}
      <header className="term-header" {...draggableProvided?.dragHandleProps}>
        {/* add course button for the term card */}
        {hasSelectedCourses && showButtons ? (
          <button className="add-course-button" onClick={handleAddCourse}>
            {t([I18nKey.ADD_TO], lang, { item1: term.name })}
          </button>
        ) : (
          <span className="term-name-container">
            {mapSeason(termSeason)}
            <span className="term-name">
              <span>{term.name}</span>
              {isEditing && (
                <select
                  value={term.name}
                  onChange={(e) => {
                    setIsEditing(false);
                    startTransition(() => {
                      dispatch(
                        renameTerm({
                          termId: term._id.toString(),
                          newName: e.target.value,
                        }),
                      );
                    });
                  }}
                  onBlur={() => {
                    setIsEditing(false);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsEditing(false);
                  }}
                  className="select-term-name"
                  ref={selectRef}
                  form={`term-name-form-${term._id}`}
                  onSubmit={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsEditing(false);
                  }}
                >
                  {mockTermNames(
                    CURR_ACADEMIC_YEAR_RANGE,
                    5,
                    !isValidTermName(term.name, lang) ? term.name : "",
                    lang,
                  )[lang].map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              )}
            </span>
            <SelectIcon
              className={clsx([
                "select",
                "clickable",
                (isSeekingCourse ||
                  hasSelectedCourses ||
                  isDragging ||
                  !showButtons) &&
                  "hidden",
              ])}
              onClick={() => {
                setIsEditing((prev) => !prev);
              }}
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
                    termSeason={termSeason}
                    handleDelete={handleDeleteCourse}
                    setIsExpanded={setIsCourseExpanded}
                    isDraggingTerm={isDraggingTerm ?? false}
                    draggableProvided={courseDraggableProvided}
                    draggableSnapshot={courseDraggableSnapshot}
                    isExport={isExport}
                    expandCourses={expandCourses}
                    isTermInCurrentYear={isCurrYearTerm}
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
                termSeason={termSeason}
                handleDelete={handleDeleteCourse}
                setIsExpanded={setIsCourseExpanded}
                isDraggingTerm={isDraggingTerm ?? false}
                isExport={isExport}
                expandCourses={expandCourses}
                isTermInCurrentYear={isCurrYearTerm}
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
