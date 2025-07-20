"use client";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useCallback, useMemo } from "react";
import DnDSection from "./DnDSection";
import type { SubSectionProps } from "./SubSection";
import { deletePlan } from "@/store/slices/userDataSlice";
import { DropdownOption } from "@/types/local";
import type { DropResult } from "@hello-pangea/dnd";
import { setIsDragging } from "@/store/slices/globalSlice";
import { DraggingType } from "@/lib/enums";
import { movePlan } from "@/store/slices/userDataSlice";
import { setCurrentPlanId } from "@/store/slices/localDataSlice";

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

  const handleSelectPlan = useCallback(
    (planId: string) => {
      dispatch(setCurrentPlanId(planId));
    },
    [dispatch],
  );

  const handleDeletePlan = useCallback(
    (planId: string) => {
      dispatch(deletePlan(planId));
    },
    [dispatch],
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
            content: plan?.name ?? `ERROR: ${planId}`,
            handleClick: handleSelectPlan,
            isChecked: planId === currentPlanId,
            isKeepDMOpen: true,
          } as DropdownOption,
          isOpenToLeft: false,
          items: [
            {
              id: planId,
              content: "Delete",
              handleClick: handleDeletePlan,
              isHideIndicator: true,
              isHideFiller: true,
            },
            // {
            //   id: 'rename',
            //   content: 'Rename',
            //   handleClick: () => {},
            // },
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
    ],
  );

  return (
    <DnDSection
      label="Plans"
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
