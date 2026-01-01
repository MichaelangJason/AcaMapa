"use client";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useCallback, useMemo } from "react";
import DnDSection from "@/components/Common/DropdownMenu/DnDSection";
import type { SubSectionProps } from "@/components/Common/DropdownMenu/SubSection";
import { deletePlan, renamePlan } from "@/store/slices/userDataSlice";
import { DropdownOption } from "@/types/local";
import type { DropResult } from "@hello-pangea/dnd";
import { setIsDragging } from "@/store/slices/globalSlice";
import { DraggingType } from "@/lib/enums";
import { movePlan } from "@/store/slices/userDataSlice";
import {
  setCurrentPlanId,
  setSimpleModalInfo,
} from "@/store/slices/localDataSlice";
import { MAX_PLAN_NAME_LEN } from "@/lib/constants";
import { I18nKey, Language, t } from "@/lib/i18n";
import { prepareExport } from "@/store/thunks";

const Plans = ({
  handleCloseDropdownMenu,
}: {
  handleCloseDropdownMenu: () => void;
}) => {
  const plans = useAppSelector((state) => state.userData.planData);
  const planOrder = useAppSelector((state) => state.userData.planOrder);
  const currentPlanId = useAppSelector(
    (state) => state.localData.currentPlanId,
  );
  const dispatch = useAppDispatch();
  const lang = useAppSelector((state) => state.userData.lang) as Language;

  const handleSelectPlan = useCallback(
    (planId: string) => {
      dispatch(setCurrentPlanId(planId));
      handleCloseDropdownMenu();
    },
    [dispatch, handleCloseDropdownMenu],
  );

  const handleDeletePlan = useCallback(
    (planId: string) => {
      dispatch(
        setSimpleModalInfo({
          isOpen: true,
          title: t([I18nKey.DELETE_PLAN_TITLE], lang),
          description: t([I18nKey.DELETE_PLAN_DESC], lang, {
            item1: plans.get(planId)!.name,
          }),
          confirmCb: () => {
            dispatch(deletePlan(planId));
            return Promise.resolve();
          },
          closeCb: () => {
            return Promise.resolve();
          },
        }),
      );
    },
    [dispatch, plans, lang],
  );

  const handleRenamePlan = useCallback(
    (planId: string) => {
      dispatch(
        setSimpleModalInfo({
          isOpen: true,
          title: t([I18nKey.RENAME, I18nKey.PLAN], lang),
          description: "",
          inputConfig: {
            placeholder: plans.get(planId)!.name,
            maxLength: MAX_PLAN_NAME_LEN,
          },
          confirmCb: (newName?: string) => {
            if (!newName) return Promise.resolve();
            dispatch(renamePlan({ planId, newName }));
            return Promise.resolve();
          },
          closeCb: () => {
            return Promise.resolve();
          },
        }),
      );
    },
    [dispatch, plans, lang],
  );

  const handleExportPlan = useCallback(
    async (planId: string) => {
      await dispatch(prepareExport(planId));
      handleCloseDropdownMenu();
    },
    [dispatch, handleCloseDropdownMenu],
  );

  const dragStart = useCallback(() => {
    dispatch(setIsDragging(true));
  }, [dispatch]);

  const dragEnd = useCallback(
    (result: DropResult) => {
      const { destination, source, draggableId, type } = result;

      dispatch(setIsDragging(false));
      if (!destination || type !== DraggingType.PLAN) return;
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      )
        return;

      const planId = draggableId.split("-")[0];

      dispatch(
        movePlan({
          planId,
          sourceIdx: source.index,
          destIdx: destination.index,
        }),
      );
    },
    [dispatch],
  );

  const items: SubSectionProps[] = useMemo(
    () =>
      planOrder.map((planId) => {
        const plan = plans.get(planId);
        return {
          self: {
            id: planId,
            content: plan?.name ?? t([I18nKey.ERROR], lang) + ": " + planId,
            handleClick: handleSelectPlan,
            isChecked: planId === currentPlanId,
            isKeepDMOpen: true,
          } as DropdownOption,
          isOpenToLeft: false,
          items: [
            {
              id: planId,
              content: t([I18nKey.DELETE], lang),
              handleClick: handleDeletePlan,
              isHideIndicator: true,
              isHideFiller: true,
            },
            {
              id: planId,
              content: t([I18nKey.RENAME], lang),
              handleClick: handleRenamePlan,
              isHideIndicator: true,
              isHideFiller: true,
            },
            {
              id: planId,
              content: t([I18nKey.EXPORT], lang),
              handleClick: handleExportPlan, // TODO
              isHideIndicator: true,
              isHideFiller: true,
            },
          ] as DropdownOption[],
          handleCloseDropdownMenu,
          className: "plan-item",
        };
      }),
    [
      planOrder,
      plans,
      currentPlanId,
      handleCloseDropdownMenu,
      handleDeletePlan,
      handleSelectPlan,
      handleRenamePlan,
      handleExportPlan,
      lang,
    ],
  );

  return (
    <DnDSection
      label={t([I18nKey.PLAN], lang) + "s"}
      items={items}
      dndContextProps={{
        onDragEnd: dragEnd,
        onDragStart: dragStart,
      }}
      handleCloseDropdownMenu={handleCloseDropdownMenu}
    />
  );
};

export default Plans;
