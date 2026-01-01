import { Term } from "@/types/db";
import { Language, t, I18nKey } from "../i18n";
import { useMemo } from "react";
import { ModalType, Season } from "../enums";
import { useCallback } from "react";
import { CachedDetailedCourse } from "@/types/local";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setModalState } from "@/store/slices/localDataSlice";
import { isCurrentTerm, isThisYearTerm } from "../term";

export const useTermStatus = (term: Term, courses: CachedDetailedCourse[]) => {
  const isCurrTerm = useMemo(() => isCurrentTerm(term.name), [term.name]);
  const isCurrYearTerm = useMemo(() => isThisYearTerm(term.name), [term.name]);
  const totalCredits = useMemo(() => {
    return courses.reduce((acc, course) => acc + course.credits, 0);
  }, [courses]);

  return {
    isCurrTerm,
    isCurrYearTerm,
    totalCredits,
  };
};

// TODO: normalize term name to avoid this hack
export const useTermSeason = (term: Term) => {
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

  return termSeason;
};

export const useTermCardActions = ({
  idx,
  term,
  courses,
  addCourse,
  deleteCourse,
  addTerm,
  deleteTerm,
}: {
  idx: number;
  term: Term;
  courses: CachedDetailedCourse[];
  addCourse?: (termId: string) => Promise<void>;
  deleteCourse?: (termId: string, courseId: string) => void;
  addTerm?: (termId: string, isBefore: boolean) => void;
  deleteTerm?: (termId: string, termIdx: number) => void;
}) => {
  const dispatch = useAppDispatch();
  const lang = useAppSelector((state) => state.userData.lang) as Language;

  // handle adding a course to the term
  const handleAddCourse = useCallback(async () => {
    await addCourse?.(term._id.toString());
  }, [addCourse, term._id]);

  // handle deleting a course from the term
  const handleDeleteCourse = useCallback(
    (courseId: string) => {
      deleteCourse?.(term._id.toString(), courseId);
    },
    [deleteCourse, term._id],
  );

  // handle adding a term to the plan
  const handleAddTerm = useCallback(
    (isBefore: boolean) => {
      addTerm?.(term._id.toString(), isBefore);
    },
    [addTerm, term._id],
  );

  // handle deleting a term from the plan
  const handleDeleteTerm = useCallback(() => {
    // ask for confirmation if the term has courses
    if (courses.length > 0) {
      // dispatch(
      //   setSimpleModalInfo({
      //     isOpen: true,
      //     title: t([I18nKey.DELETE_TERM_TITLE], lang),
      //     description: t([I18nKey.DELETE_TERM_DESC], lang, {
      //       item1: term.name,
      //     }),
      //     confirmCb: () => {
      //       deleteTerm?.(term._id.toString(), idx);
      //       return Promise.resolve();
      //     },
      //     closeCb: () => {
      //       return Promise.resolve();
      //     },
      //   }),
      // );
      //
      dispatch(
        setModalState({
          isOpen: true,
          props: {
            type: ModalType.SIMPLE,
            title: t([I18nKey.DELETE_TERM_TITLE], lang),
            description: t([I18nKey.DELETE_TERM_DESC], lang, {
              item1: term.name,
            }),
            confirmCb: async () => {
              deleteTerm?.(term._id.toString(), idx);
            },
          },
        }),
      );
    } else {
      deleteTerm?.(term._id.toString(), idx);
    }
  }, [deleteTerm, idx, dispatch, term, courses.length, lang]);

  return {
    handleAddCourse,
    handleDeleteCourse,
    handleAddTerm,
    handleDeleteTerm,
  };
};
