import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { useCallback } from "react";
import { toggleLang } from "@/store/slices/userDataSlice";
import clsx from "clsx";

const UserLang = () => {
  const lang = useAppSelector((state) => state.userData.lang);
  const isInitialized = useAppSelector((state) => state.global.isInitialized);
  const isDragging = useAppSelector((state) => state.global.isDragging);
  const dispatch = useAppDispatch();

  const handleClick = useCallback(() => {
    dispatch(toggleLang());
  }, [dispatch]);

  return (
    <span
      onClick={handleClick}
      className={clsx(
        "language",
        "clickable",
        !isInitialized || (isDragging && "disabled"),
      )}
    >
      {lang}
    </span>
  );
};

export default UserLang;
