"use client";

import { useEffect, useRef } from "react";
import { SideBar, UtilityBar } from "./Layout";
import { SimpleModal, ToolTips } from "./Common";
import { Terms } from "./Term";
import { Provider } from "react-redux";
import { AppStore, makeStore } from "@/store";
import type { Course } from "@/types/db";
import { getSearchFn } from "@/lib/utils";
import { setCourseData } from "@/store/slices/localDataSlice";
import { initApp } from "@/store/thunks";
import { ToastContainer, Slide } from "react-toastify";

const App = ({ courseData }: { courseData: Course[] }) => {
  // init redux store
  // REVIEW: useMemo & make it client side only
  const storeRef = useRef<AppStore>(makeStore());
  const searchCourseFnRef = useRef<(query: string) => Promise<Course[]>>(() =>
    Promise.resolve([]),
  );

  // guaranteed to run only once at initialization for the whole life cycle of the app
  useEffect(() => {
    // get search function, run only once at initialization
    searchCourseFnRef.current = getSearchFn(courseData)();
    storeRef.current.dispatch(setCourseData(courseData));
    storeRef.current.dispatch(initApp());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Provider store={storeRef.current}>
      <SideBar searchCourseFn={searchCourseFnRef.current} />
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
