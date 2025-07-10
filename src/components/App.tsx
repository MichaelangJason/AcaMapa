"use client";

import { useEffect, useRef, useState } from "react";
import { SideBar } from "./Layout";
import { Terms } from "./Term";
import { Provider } from "react-redux";
import { AppStore, makeStore } from "@/store";
import type { Course, Term } from "@/types/db";
import { useCourseSearch } from "@/lib/hooks";
import { setCourseData } from "@/store/slices/localDataSlice";
import { setIsInitialized } from "@/store/slices/globalSlice";
import { mockNewPlan } from "@/lib/mock";
import { setPlanData, setTermData } from "@/store/slices/userDataSlice";

const App = ({ courseData }: { courseData: Course[] }) => {
  // init redux store
  const [isMounted, setIsMounted] = useState(false); // to control actual mounting
  const storeRef = useRef<AppStore>(null);
  if (!storeRef.current) {
    // should only run once at init
    storeRef.current = makeStore();
    storeRef.current.dispatch(setCourseData(courseData));
  }

  // get search function, run only once at initialization
  const searchCourseAsync = useCourseSearch(courseData);

  useEffect(() => {
    // TODO: initialization logic here?
    if (!storeRef.current) {
      throw new Error("Store not initialized");
    }

    if (process.env.NODE_ENV === "development") {
      const { plan, terms } = mockNewPlan(3, "Mock Plan");
      storeRef.current.dispatch(
        setTermData({
          termData: terms.reduce(
            (acc, term) => {
              acc[term._id] = term;
              return acc;
            },
            {} as { [termId: string]: Term },
          ),
        }),
      );
      storeRef.current.dispatch(
        setPlanData({
          planData: {
            [plan._id]: plan,
          },
          planOrder: [plan._id],
        }),
      );
    }

    storeRef.current.dispatch(setIsInitialized(true));
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <Provider store={storeRef.current}>
      <SideBar searchCourseFn={searchCourseAsync} />
      {/* <UtilityBar /> */}
      <Terms />
      {/* <Assistant /> */}
    </Provider>
  );
};

export default App;
