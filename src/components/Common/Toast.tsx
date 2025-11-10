import { ToastContainer, Slide } from "react-toastify";

export default function Toast() {
  return (
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
  );
}
