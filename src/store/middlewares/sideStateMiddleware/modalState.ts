import { setIsModalOpen } from "@/store/slices/globalSlice";
import {
  setSeekingCourseId,
  setSeekingProgramName,
  setModalState,
  clearModalState,
} from "@/store/slices/localDataSlice";
import { isAnyOf } from "@reduxjs/toolkit";
import { startListening } from "./core";

// handle modal open updates only
startListening({
  matcher: isAnyOf(setModalState, clearModalState),
  effect: (action, listenerApi) => {
    const state = listenerApi.getState();

    const isAnyModalOpen = state.localData.modalState.isOpen;
    const isModalOpenFlag = listenerApi.getState().global.isModalOpen;

    if (isModalOpenFlag !== isAnyModalOpen) {
      // update the modal open flag
      listenerApi.dispatch(setIsModalOpen(isAnyModalOpen));

      // clear seeking information if any modal is open
      if (isAnyModalOpen) {
        listenerApi.dispatch(setSeekingCourseId(""));
        listenerApi.dispatch(setSeekingProgramName(""));
      }
    }
  },
});
