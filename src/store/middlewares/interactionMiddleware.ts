import { createListenerMiddleware } from "@reduxjs/toolkit";
import { AppDispatch, RootState } from "..";
import { addTerm } from "../slices/termSlice";

const listenerMiddleware = createListenerMiddleware();
const startListening = listenerMiddleware.startListening.withTypes<
  RootState,
  AppDispatch
>();

startListening({
  actionCreator: addTerm,
  effect: () => {
    // scroll to rightmost after adding term
    setTimeout(() => {
      const body = document.documentElement;
      const scrollWidth = Math.max(
        body.scrollWidth - window.innerWidth,
        0
      );
      window.scrollTo({
        left: scrollWidth,
        behavior: 'smooth'
      });
    }, 50);
  }
})

export default listenerMiddleware.middleware;