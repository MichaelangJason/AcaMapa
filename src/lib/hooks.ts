import { ItemProps } from "@/components/Common/DropdownMenu";
import {
  toggleIsSideBarFolded,
  toggleIsCourseTakenExpanded,
  toggleIsUtilityDropdownMenuOpen,
} from "@/store/slices/globalSlice";
import {
  setIsImportModalOpen,
  setIsProgramModalOpen,
  setSimpleModalInfo,
} from "@/store/slices/localDataSlice";
import { addPlan, addTerm, deletePlan } from "@/store/slices/userDataSlice";
import { prepareExport } from "@/store/thunks";
import { useCallback, useMemo, useRef } from "react";
import { t, I18nKey, Language } from "./i18n";
import { getCommandKey } from "./utils";
import { AppDispatch } from "@/store";
import { useAppSelector } from "@/store/hooks";

export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
): T {
  const timeoutRef = useRef<NodeJS.Timeout>(null);

  return useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    }) as T,
    [callback, delay],
  );
}

interface ThrottleOptions {
  delay: number;
  leading?: boolean; // Execute on first call
  trailing?: boolean; // Execute on last call
}

export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  options: ThrottleOptions,
) => {
  const { delay, leading = true, trailing = true } = options;
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastArgsRef = useRef<Parameters<T> | null>(null);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      lastArgsRef.current = args;

      // Leading edge execution
      if (leading && now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        callback(...args);
        return;
      }

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Trailing edge execution
      if (trailing) {
        timeoutRef.current = setTimeout(
          () => {
            lastCallRef.current = Date.now();
            if (lastArgsRef.current) {
              callback(...lastArgsRef.current);
            }
            timeoutRef.current = null;
          },
          delay - (now - lastCallRef.current),
        );
      }
    },
    [callback, delay, leading, trailing],
  );

  // Cleanup function
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    lastArgsRef.current = null;
  }, []);

  return { throttledCallback, cancel };
};

export const useDropdownActions = (
  isInitialized: boolean,
  lang: Language,
  dispatch: AppDispatch,
  currentPlanId: string,
) => {
  const plans = useAppSelector((state) => state.userData.planData);
  const actions = useMemo(() => {
    if (!isInitialized) return [];
    return [
      {
        self: {
          id: "add-plan",
          content: t([I18nKey.ADD, I18nKey.PLAN], lang),
          handleClick: () => {
            dispatch(addPlan());
          }, // add an empty plan
        },
        shortcut: [getCommandKey(), "P"],
      },
      {
        self: {
          id: "add-term",
          content: t([I18nKey.ADD, I18nKey.SEMESTER], lang),
          handleClick: () =>
            dispatch(
              addTerm({
                planId: currentPlanId,
                idx: -1,
              }),
            ), // add an empty term
        },
        shortcut: [getCommandKey(), "N"],
      },
      {
        self: {
          id: "search-program",
          content: t([I18nKey.ADD, I18nKey.PROGRAM], lang),
          handleClick: () => {
            dispatch(setIsProgramModalOpen(true));
          },
        },
      },
      {
        self: {
          id: "toggle-sidebar",
          content: t([I18nKey.TOGGLE, I18nKey.SIDEBAR], lang),
          handleClick: () => {
            dispatch(toggleIsSideBarFolded());
          },
        },
        shortcut: [getCommandKey(), "B"],
      },
      {
        self: {
          id: "toggle-course-taken",
          content: t([I18nKey.TOGGLE, I18nKey.COURSE_TAKEN], lang),
          handleClick: () => {
            dispatch(toggleIsCourseTakenExpanded());
          },
        },
        shortcut: [getCommandKey(), "I"],
      },
      {
        self: {
          id: "toggle-dropdown-menu",
          content: t([I18nKey.TOGGLE, I18nKey.DROPDOWN_MENU], lang),
          handleClick: () => {
            dispatch(toggleIsUtilityDropdownMenuOpen());
          },
        },
        shortcut: [getCommandKey(), "M"],
      },
      {
        self: {
          id: "delete-current-plan",
          content: t([I18nKey.DELETE, I18nKey.CURRENT_PLAN], lang),
          handleClick: () => {
            dispatch(
              setSimpleModalInfo({
                isOpen: true,
                title: t([I18nKey.DELETE_PLAN_TITLE], lang),
                description: t([I18nKey.DELETE_PLAN_DESC], lang, {
                  item1: plans.get(currentPlanId)!.name,
                }),
                confirmCb: () => {
                  dispatch(deletePlan(currentPlanId));
                  return Promise.resolve();
                },
                closeCb: () => {
                  return Promise.resolve();
                },
              }),
            );
          },
        },
      },
      {
        self: {
          id: "export-current-plan",
          content: t([I18nKey.EXPORT, I18nKey.CURRENT_PLAN], lang),
          handleClick: () => {
            dispatch(prepareExport(currentPlanId));
          },
        },
      },
      {
        self: {
          id: "import-plan",
          content: t([I18nKey.IMPORT_PLAN], lang),
          handleClick: () => {
            dispatch(setIsImportModalOpen(true));
          },
        },
      },
    ];
  }, [dispatch, currentPlanId, isInitialized, lang]) as ItemProps[];

  return actions;
};
