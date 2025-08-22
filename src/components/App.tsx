"use client";

import { useEffect, useMemo } from "react";
import { SideBar, UtilityBar } from "./Layout";
import { SimpleModal, ToolTips, ExportModal, ProgramModal } from "./Common";
import { Terms } from "./Term";
import { Provider } from "react-redux";
import { AppStore, makeStore } from "@/store";
import type { Course, Program } from "@/types/db";
import { setCourseData, setProgramData } from "@/store/slices/localDataSlice";
import { initApp } from "@/store/thunks";
import { ToastContainer, Slide } from "react-toastify";
import { SessionProvider } from "next-auth/react";
import type { Session } from "@/types/local";

const App = ({
  courseData,
  programData,
  session,
}: {
  courseData: Course[];
  programData: Program[];
  session: Session | null;
}) => {
  // init redux store
  // REVIEW: make it client side only?
  const store = useMemo<AppStore>(makeStore, []);

  // guaranteed to run only once at initialization for the whole life cycle of the app
  useEffect(() => {
    store.dispatch(setCourseData(courseData));
    store.dispatch(setProgramData(programData));
    store.dispatch(initApp({ courseData, programData, session }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SessionProvider session={session} refetchInterval={0}>
      <Provider store={store}>
        <SideBar />
        <UtilityBar />
        <Terms />
        {/* <Assistant /> */}
        <ExportModal />
        <SimpleModal />
        <ProgramModal />
        <ToolTips />
        <ToastContainer
          position="bottom-center"
          autoClose={3000}
          hideProgressBar={true}
          newestOnTop={false}
          closeOnClick={true}
          pauseOnHover={false}
          rtl={false}
          draggable
          theme="light"
          transition={Slide}
        />
      </Provider>
    </SessionProvider>
  );
};

export default App;
