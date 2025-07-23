"use client";

import { useEffect, useMemo } from "react";
import { SideBar, UtilityBar } from "./Layout";
import { SimpleModal, ToolTips } from "./Common";
import { Terms } from "./Term";
import { Provider } from "react-redux";
import { AppStore, makeStore } from "@/store";
import type { Course } from "@/types/db";
import { setCourseData } from "@/store/slices/localDataSlice";
import { initApp } from "@/store/thunks";
import { ToastContainer, Slide } from "react-toastify";

const App = ({ courseData }: { courseData: Course[] }) => {
  // init redux store
  // REVIEW: useMemo & make it client side only
  const store = useMemo<AppStore>(makeStore, []);

  // guaranteed to run only once at initialization for the whole life cycle of the app
  useEffect(() => {
    store.dispatch(setCourseData(courseData));
    store.dispatch(initApp(courseData));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Provider store={store}>
      <SideBar />
      <UtilityBar />
      <Terms />
      {/* <Assistant /> */}
      <SimpleModal />
      <ToolTips />
      <ToastContainer
        position="bottom-center"
        autoClose={3000}
        hideProgressBar={true}
        newestOnTop={true}
        closeOnClick={true}
        pauseOnHover={false}
        rtl={false}
        draggable
        theme="light"
        transition={Slide}
        stacked
      />
    </Provider>
  );
};

export default App;
