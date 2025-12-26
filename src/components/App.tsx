"use client";

import { useEffect, useMemo } from "react";
import { SideBar, UtilityBar } from "./Layout";
import { Modals, ToolTips, Toast } from "./Common";
import { Terms } from "./Term";
import { Provider } from "react-redux";
import { AppStore, makeStore } from "@/store";
import type { Course, Program } from "@/types/db";
import { setCourseData, setProgramData } from "@/store/slices/localDataSlice";
import { initApp } from "@/store/thunks";
import type { Session } from "@/types/auth";

const App = ({
  courseData,
  programData,
  session,
}: {
  courseData: Course[];
  programData: Program[];
  session: Session | null;
}) => {
  // init redux store before first paint
  // REVIEW: make it client side only?
  const store = useMemo<AppStore>(makeStore, []);

  // guaranteed to run only once at initialization for the whole life cycle of the app
  // runs after first commit
  useEffect(() => {
    store.dispatch(setCourseData(courseData));
    store.dispatch(setProgramData(programData));
    store.dispatch(initApp({ courseData, programData, session }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Provider store={store}>
      <SideBar />

      <UtilityBar />

      <Terms />

      {/* <Assistant /> */}

      <Modals />

      <ToolTips />

      <Toast />
    </Provider>
  );
};

export default App;
