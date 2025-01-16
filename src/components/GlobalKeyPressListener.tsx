/* eslint-disable react-hooks/exhaustive-deps */
import { setAddingCourseId, setSeekingInfo } from "@/store/globalSlice";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

export const GlobalKeyPressListener = () => {
  const dispatch = useDispatch();

  const handleKeyDown = (event: KeyboardEvent) => {
    const key = event.key;

    if (key === "Escape") {
      dispatch(setAddingCourseId(null));
      dispatch(setSeekingInfo({ })); // clear seeking info
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
  }, []);

  return null;
}

export default GlobalKeyPressListener;