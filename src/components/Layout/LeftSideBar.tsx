"use client";

import { SearchInput } from "../Common";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleIsLeftSideBarFolded } from "@/store/slices/globalSlice";
import { useCallback } from "react";
import Image from "next/image";
import ExpandIcon from "@/public/icons/expand.svg";
import clsx from "clsx";

const LeftSideBar = () => {
  const dispatch = useAppDispatch();

  const isFolded = useAppSelector((state) => state.global.isLeftSideBarFolded);
  const toggleFolded = useCallback(
    async () => dispatch(toggleIsLeftSideBarFolded()),
    [dispatch],
  );

  return (
    <div className={clsx(["left-sidebar", isFolded && "folded"])}>
      {/* header */}
      <header>
        <Image
          src="/mcgill-logo.png"
          alt="logo"
          width={1280}
          height={303}
          priority={true}
        />
        <SearchInput
          callback={async () => {
            console.log("debounced?");
          }}
        />
      </header>
      {/* results */}

      {/* folding handle */}
      <div className="right-handle" onClick={toggleFolded}>
        <ExpandIcon className={clsx(["expand", isFolded && "flipped"])} />
      </div>
    </div>
  );
};

export default LeftSideBar;
