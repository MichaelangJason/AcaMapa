import { ItemProps } from "@/components/Common/DropdownMenu";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  toggleIsSideBarFolded,
  toggleIsCourseTakenExpanded,
  toggleIsUtilityDropdownMenuOpen,
} from "@/store/slices/globalSlice";
import {
  setAllCoursesExpanded,
  setModalState,
} from "@/store/slices/localDataSlice";
import { addPlan, addTerm, deletePlan } from "@/store/slices/userDataSlice";
import { prepareExport } from "@/store/thunks";
import { useMemo, useEffect, useCallback } from "react";
import { t, I18nKey } from "../i18n";
import { getCommandKey } from "../utils";
import { ModalType } from "@/lib/enums";

export const useDropdownActions = () => {
  const isInitialized = useAppSelector((state) => state.global.isInitialized);
  const lang = useAppSelector((state) => state.userData.lang);
  const dispatch = useAppDispatch();
  const plans = useAppSelector((state) => state.userData.planData);
  const currentPlanId = useAppSelector(
    (state) => state.localData.currentPlanId,
  );

  const handleAddPlan = useCallback(() => {
    dispatch(addPlan());
  }, [dispatch]);

  const handleAddTerm = useCallback(() => {
    dispatch(
      addTerm({
        planId: currentPlanId,
        idx: -1,
      }),
    );
  }, [dispatch, currentPlanId]);

  const handleOpenProgramModal = useCallback(() => {
    dispatch(
      setModalState({
        isOpen: true,
        props: {
          type: ModalType.PROGRAM,
        },
      }),
    );
  }, [dispatch]);

  const handleToggleSideBar = useCallback(() => {
    dispatch(toggleIsSideBarFolded());
  }, [dispatch]);

  const handleToggleCourseTaken = useCallback(() => {
    dispatch(toggleIsCourseTakenExpanded());
  }, [dispatch]);

  const handleToggleDropdownMenu = useCallback(() => {
    dispatch(toggleIsUtilityDropdownMenuOpen());
  }, [dispatch]);

  const handleExportPlan = useCallback(() => {
    dispatch(prepareExport(currentPlanId));
  }, [dispatch, currentPlanId]);

  const handleImportPlan = useCallback(() => {
    dispatch(
      setModalState({
        isOpen: true,
        props: {
          type: ModalType.IMPORT,
        },
      }),
    );
  }, [dispatch]);

  const handleDeletePlan = useCallback(() => {
    dispatch(
      setModalState({
        isOpen: true,
        props: {
          type: ModalType.SIMPLE,
          title: t([I18nKey.DELETE_PLAN_TITLE], lang),
          description: t([I18nKey.DELETE_PLAN_DESC], lang, {
            item1: plans.get(currentPlanId)!.name,
          }),
          confirmCb: async () => {
            dispatch(deletePlan(currentPlanId));
          },
        },
      }),
    );
  }, [dispatch, currentPlanId, plans, lang]);

  const handleFoldAllCourses = useCallback(() => {
    dispatch(
      setAllCoursesExpanded({
        planId: currentPlanId,
        isExpanded: false,
      }),
    );
  }, [dispatch, currentPlanId]);

  const handleUnfoldAllCourses = useCallback(() => {
    dispatch(
      setAllCoursesExpanded({
        planId: currentPlanId,
        isExpanded: true,
      }),
    );
  }, [dispatch, currentPlanId]);

  const actions = useMemo(() => {
    if (!isInitialized) return [];
    return [
      {
        self: {
          id: "fold-all-courses",
          content: t([I18nKey.FOLD_ALL_COURSES], lang),
          handleClick: handleFoldAllCourses,
        },
      },
      {
        self: {
          id: "unfold-all-courses",
          content: t([I18nKey.UNFOLD_ALL_COURSES], lang),
          handleClick: handleUnfoldAllCourses,
        },
      },
      {
        self: {
          id: "add-plan",
          content: t([I18nKey.ADD, I18nKey.PLAN], lang),
          handleClick: handleAddPlan,
        },
        shortcut: [getCommandKey(), "P"],
      },
      {
        self: {
          id: "add-term",
          content: t([I18nKey.ADD, I18nKey.SEMESTER], lang),
          handleClick: handleAddTerm,
        },
        shortcut: [getCommandKey(), "N"],
      },
      {
        self: {
          id: "search-program",
          content: t([I18nKey.ADD, I18nKey.PROGRAM], lang),
          handleClick: handleOpenProgramModal,
        },
      },
      {
        self: {
          id: "toggle-sidebar",
          content: t([I18nKey.TOGGLE, I18nKey.SIDEBAR], lang),
          handleClick: handleToggleSideBar,
        },
        shortcut: [getCommandKey(), "B"],
      },
      {
        self: {
          id: "toggle-course-taken",
          content: t([I18nKey.TOGGLE, I18nKey.COURSE_TAKEN], lang),
          handleClick: handleToggleCourseTaken,
        },
        shortcut: [getCommandKey(), "I"],
      },
      {
        self: {
          id: "toggle-dropdown-menu",
          content: t([I18nKey.TOGGLE, I18nKey.DROPDOWN_MENU], lang),
          handleClick: handleToggleDropdownMenu,
        },
        shortcut: [getCommandKey(), "M"],
      },
      {
        self: {
          id: "delete-current-plan",
          content: t([I18nKey.DELETE, I18nKey.CURRENT_PLAN], lang),
          handleClick: handleDeletePlan,
        },
      },
      {
        self: {
          id: "export-current-plan",
          content: t([I18nKey.EXPORT, I18nKey.CURRENT_PLAN], lang),
          handleClick: handleExportPlan,
        },
      },
      {
        self: {
          id: "import-plan",
          content: t([I18nKey.IMPORT_PLAN], lang),
          handleClick: handleImportPlan,
        },
      },
    ];
  }, [
    handleAddPlan,
    handleAddTerm,
    handleOpenProgramModal,
    handleToggleSideBar,
    handleToggleCourseTaken,
    handleToggleDropdownMenu,
    handleDeletePlan,
    handleExportPlan,
    handleImportPlan,
    handleFoldAllCourses,
    handleUnfoldAllCourses,
    isInitialized,
    lang,
  ]) as ItemProps[];

  return actions;
};

export const useRegisterShortcuts = (
  actions: ItemProps[],
  isInitialized: boolean,
) => {
  // register shortcut keys, runs only once when the app is initialized
  useEffect(() => {
    if (!isInitialized) return;

    // create a map of shortcut keys to action items
    const entries = actions
      .map((item) => [item.shortcut?.[1].toLowerCase() ?? "", item.self])
      .filter(([key]) => key !== "") as [string, ItemProps["self"]][];

    if (entries.length === 0) return;
    // create a map of shortcut keys to action items
    const keyMap = new Map<string, ItemProps["self"]>(entries);
    const keySet = new Set<string>(keyMap.keys());

    // handle key down event
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.metaKey && !event.ctrlKey) return; // only handle meta/ctrl key
      if (!keySet.has(event.key.toLowerCase())) return; // only handle keys in the keySet

      const item = keyMap.get(event.key.toLowerCase());
      if (item) {
        event.preventDefault();
        event.stopPropagation();
        item.handleClick(item.id);
      } else {
        console.log("key not found", event.key.toLowerCase());
      }
    };

    // add event listener for key down event
    window.addEventListener("keydown", handleKeyDown);
    // remove event listener when the component unmounts
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [actions, isInitialized]);
};
