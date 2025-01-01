/* eslint-disable react-hooks/exhaustive-deps */
import { setAddingCourseId } from "@/store/eventSlice";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

export const GlobalKeyPressListener = () => {
  const dispatch = useDispatch();

  const handleKeyDown = (event: KeyboardEvent) => {
    const key = event.key;
    console.log(key);

    if (key === "Escape") {
      dispatch(setAddingCourseId(null));
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
  }, []);

  return null;
}

export default GlobalKeyPressListener;