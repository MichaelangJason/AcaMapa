"use client";

import { useRef } from "react";
import { LeftSideBar } from "./Layout";
import { Provider } from "react-redux";
import { AppStore, makeStore } from "@/store";

const App = () => {
  // init redux store
  const storeRef = useRef<AppStore>(null);
  if (!storeRef.current) {
    // should only run once at init
    console.log("making new store");
    storeRef.current = makeStore();
  }

  return (
    <Provider store={storeRef.current}>
      <LeftSideBar />
    </Provider>
  );
};

export default App;
