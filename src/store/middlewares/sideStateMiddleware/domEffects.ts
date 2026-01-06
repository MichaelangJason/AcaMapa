import { scrollTermCardToView } from "@/lib/utils";
import {
  setIsModalOpen,
  setIsSeekingCourse,
  setIsSideBarFolded,
  toggleIsSideBarFolded,
} from "@/store/slices/globalSlice";
import { addTerm } from "@/store/slices/userDataSlice";
import { isAnyOf } from "@reduxjs/toolkit";
import { startListening } from "./core";

// TODO: switch to use css variable instead of hardcoded values
// handle sidebar updates only
startListening({
  matcher: isAnyOf(setIsSideBarFolded, toggleIsSideBarFolded),
  effect: (_, listenerApi) => {
    const isSideBarFolded = listenerApi.getState().global.isSideBarFolded;

    if (isSideBarFolded) {
      window.document.body.style.paddingLeft = "0";
      const utilityBar = document.querySelector(".utility-bar");
      if (utilityBar) {
        utilityBar.setAttribute("style", "padding-left: 12px;");
      }
    } else {
      window.document.body.style.paddingLeft = "var(--sidebar-width)";
      const utilityBar = document.querySelector(".utility-bar");
      if (utilityBar) {
        utilityBar.setAttribute(
          "style",
          "padding-left: calc(var(--sidebar-width) + 12px);",
        );
      }
    }
  },
});

// handle term card scroll updates only
startListening({
  actionCreator: addTerm,
  effect: (action) => {
    const { idx } = action.payload;
    setTimeout(() => {
      scrollTermCardToView(idx, {
        duration: 500,
      });
    }, 100);
  },
});

// handle disable body scroll:
startListening({
  matcher: isAnyOf(setIsSeekingCourse, setIsModalOpen),
  effect: (_, listenerApi) => {
    const state = listenerApi.getState();
    const isSeekingCourse = state.global.isSeekingCourse;
    const isModalOpen = state.global.isModalOpen;

    if (isSeekingCourse || isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  },
});
