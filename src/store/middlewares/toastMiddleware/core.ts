import { RootState, AppDispatch } from "@/store";
import { createListenerMiddleware, type UnknownAction } from "@reduxjs/toolkit";

const listenerMiddleware = createListenerMiddleware();
export const startListening = listenerMiddleware.startListening.withTypes<
  RootState,
  AppDispatch
>();

export type ListenerApi = Parameters<
  Parameters<typeof startListening>[0]["effect"]
>[1];
export type HandlerContext<T extends UnknownAction> = {
  action: T;
  listenerApi: ListenerApi;
};

export const middleware = listenerMiddleware.middleware;
