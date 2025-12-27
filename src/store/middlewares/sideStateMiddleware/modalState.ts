import { setIsModalOpen } from "@/store/slices/globalSlice";
import {
  setSimpleModalInfo,
  clearSimpleModalInfo,
  setExportPlanId,
  clearExportPlanId,
  setIsProgramModalOpen,
  clearIsProgramModalOpen,
  setIsInfoModalOpen,
  clearIsInfoModalOpen,
  setIsImportModalOpen,
  clearIsImportModalOpen,
  setSeekingCourseId,
  setSeekingProgramName,
} from "@/store/slices/localDataSlice";
import { isAnyOf } from "@reduxjs/toolkit";
import { startListening } from "./core";

// handle modal open updates only
startListening({
  matcher: isAnyOf(
    setSimpleModalInfo,
    clearSimpleModalInfo,
    setExportPlanId,
    clearExportPlanId,
    setIsProgramModalOpen,
    clearIsProgramModalOpen,
    setIsInfoModalOpen,
    clearIsInfoModalOpen,
    setIsImportModalOpen,
    clearIsImportModalOpen,
  ),
  effect: (action, listenerApi) => {
    const state = listenerApi.getState();
    const isSimpleModalOpen =
      action.type === setSimpleModalInfo.type &&
      state.localData.simpleModalInfo.isOpen;
    const isExportModalOpen =
      action.type === setExportPlanId.type &&
      state.localData.exportPlanId !== "";
    const isProgramModalOpen =
      action.type === setIsProgramModalOpen.type &&
      state.localData.isProgramModalOpen;
    const isInfoModalOpen =
      action.type === setIsInfoModalOpen.type &&
      state.localData.isInfoModalOpen;
    const isImportModalOpen =
      action.type === setIsImportModalOpen.type &&
      state.localData.isImportModalOpen;

    const isModalOpen = listenerApi.getState().global.isModalOpen;

    const isAnyModalOpen =
      isSimpleModalOpen ||
      isExportModalOpen ||
      isProgramModalOpen ||
      isInfoModalOpen ||
      isImportModalOpen;

    if (isModalOpen !== isAnyModalOpen) {
      listenerApi.dispatch(setIsModalOpen(isAnyModalOpen));
      if (isAnyModalOpen) {
        listenerApi.dispatch(setSeekingCourseId(""));
        listenerApi.dispatch(setSeekingProgramName(""));
      }
    }
  },
});
