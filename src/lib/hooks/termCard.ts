import { Language, t, I18nKey } from "../i18n";
import { useMemo } from "react";
import { ModalType, Season } from "../enums";
import { useCallback } from "react";
import { useAppDispatch, useAppSelector, useAppStore } from "@/store/hooks";
import { setModalState } from "@/store/slices/localDataSlice";
import { isCurrentTerm, isThisYearTerm } from "../term";

export const useTermStatus = (termName: string, courseIds: string[]) => {
  const store = useAppStore();
  const isCurrTerm = useMemo(() => isCurrentTerm(termName), [termName]);
  const isCurrYearTerm = useMemo(() => isThisYearTerm(termName), [termName]);
  const totalCredits = useMemo(() => {
    const courseData = store.getState().localData.courseData;
    return courseIds.reduce(
      (acc: number, courseId: string) =>
        acc + (courseData[courseId]?.credits ?? 0),
      0,
    );
  }, [courseIds, store]);

  return {
    isCurrTerm,
    isCurrYearTerm,
    totalCredits,
  };
};

// TODO: normalize term name to avoid this hack
export const useTermSeason = (termName: string) => {
  const termSeason = useMemo(() => {
    const normalizedTermName = termName.toLowerCase();
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
  }, [termName]);

  return termSeason;
};

export const useTermCardActions = ({
  idx,
  termName,
  termId,
  courseIds,
  addCourse,
  deleteCourse,
  addTerm,
  deleteTerm,
}: {
  idx: number;
  termName: string;
  termId: string;
  courseIds: string[];
  addCourse?: (termId: string) => Promise<void>;
  deleteCourse?: (termId: string, courseId: string) => void;
  addTerm?: (termId: string, isBefore: boolean) => void;
  deleteTerm?: (termId: string, termIdx: number) => void;
}) => {
  const dispatch = useAppDispatch();
  const lang = useAppSelector((state) => state.userData.lang) as Language;

  // handle adding a course to the term
  const handleAddCourse = useCallback(async () => {
    await addCourse?.(termId);
  }, [addCourse, termId]);

  // handle deleting a course from the term
  const handleDeleteCourse = useCallback(
    (courseId: string) => {
      deleteCourse?.(termId, courseId);
    },
    [deleteCourse, termId],
  );

  // handle adding a term to the plan
  const handleAddTerm = useCallback(
    (isBefore: boolean) => {
      addTerm?.(termId, isBefore);
    },
    [addTerm, termId],
  );

  // handle deleting a term from the plan
  const handleDeleteTerm = useCallback(() => {
    // ask for confirmation if the term has courses
    if (courseIds.length > 0) {
      dispatch(
        setModalState({
          isOpen: true,
          props: {
            type: ModalType.SIMPLE,
            title: t([I18nKey.DELETE_TERM_TITLE], lang),
            description: t([I18nKey.DELETE_TERM_DESC], lang, {
              item1: termName,
            }),
            confirmCb: async () => {
              deleteTerm?.(termId, idx);
            },
          },
        }),
      );
    } else {
      deleteTerm?.(termId, idx);
    }
  }, [deleteTerm, idx, dispatch, termName, termId, courseIds.length, lang]);

  return {
    handleAddCourse,
    handleDeleteCourse,
    handleAddTerm,
    handleDeleteTerm,
  };
};
