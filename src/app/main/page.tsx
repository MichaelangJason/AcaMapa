"use client"

import GlobalKeyPressListener from "@/components/GlobalKeyPressListener";
import SideBar from "@/components/SideBar";
import Terms from "@/components/Terms";
import store from "@/store/store";
import { Provider } from "react-redux";
import { Flip, ToastContainer } from "react-toastify";

export default function Main() {
  return (
    <Provider store={store}>
      <SideBar />
      <Terms />
      <GlobalKeyPressListener />
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        draggable
        theme="light"
        transition={Flip}
        stacked
      />
    </Provider>
  );
}
