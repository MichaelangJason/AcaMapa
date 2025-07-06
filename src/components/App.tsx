"use client";

import { useRef } from "react";
import { LeftSideBar } from "./Layout";
import { Provider } from "react-redux";
import { AppStore, makeStore } from "@/store";
import { Course } from "@/types/db";
import { useCourseSearch } from "@/lib/hooks";
import { setCourseData } from "@/store/slices/localDataSlice";

const App = ({ courseData }: { courseData: Course[] }) => {
  // init redux store
  const storeRef = useRef<AppStore>(null);
  if (!storeRef.current) {
    // should only run once at init
    storeRef.current = makeStore();
    storeRef.current.dispatch(setCourseData(courseData));
  }

  // get search function, run only once at initialization
  const searchCourseAsync = useCourseSearch(courseData);

  return (
    <Provider store={storeRef.current}>
      <LeftSideBar searchCourseFn={searchCourseAsync} />
    </Provider>
  );
};

export default App;
