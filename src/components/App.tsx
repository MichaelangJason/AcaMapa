"use client";

import { useEffect, useRef, useState } from "react";
import { SideBar, UtilityBar } from "./Layout";
import { SimpleModal, ToolTips } from "./Common";
import { Terms } from "./Term";
import { Provider } from "react-redux";
import { AppStore, makeStore } from "@/store";
import type { Course } from "@/types/db";
import { useCourseSearch } from "@/lib/hooks";
import { setCourseData } from "@/store/slices/localDataSlice";
import { initApp } from "@/store/thunks";
import { ToastContainer, Slide } from "react-toastify";

const App = ({ courseData }: { courseData: Course[] }) => {
  // init redux store
  const [isMounted, setIsMounted] = useState(false); // to control actual mounting
  const storeRef = useRef<AppStore>(null);
  if (!storeRef.current) {
    // should only run once at init
    storeRef.current = makeStore();
    storeRef.current.dispatch(setCourseData(courseData));
    storeRef.current.dispatch(initApp());
  }

  // get search function, run only once at initialization
  const searchCourseAsync = useCourseSearch(courseData);

  useEffect(() => {
    const isInitialized = storeRef.current?.getState().global.isInitialized;
    if (!isInitialized) return;
    setIsMounted(true);
  }, [storeRef]);

  if (!isMounted) return null;

  return (
    <Provider store={storeRef.current}>
      <SideBar searchCourseFn={searchCourseAsync} />
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
