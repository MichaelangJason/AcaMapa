"use client";

import Image from "next/image";
import { SearchInput } from "../Common";

const LeftSideBar = () => {
  return (
    <div className="left-sidebar">
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
    </div>
  );
};

export default LeftSideBar;
