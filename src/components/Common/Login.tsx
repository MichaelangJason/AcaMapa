"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import ItemTag from "./ItemTag";
import { useCallback, useMemo } from "react";

const UserSession = () => {
  const { data: session } = useSession();

  const item = useMemo(() => {
    if (session) {
      return ["Logout"];
    }
    return [];
  }, [session]);

  const handleClickItem = useCallback((item: string) => {
    if (item === "Logout") {
      signOut();
    } else {
      signIn();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ItemTag
      items={item}
      title={session?.user?.email ?? "Login with McGill email"}
      handleClickTag={session ? undefined : signIn}
      handleClickItem={handleClickItem}
      isPinnable={false}
      style={{
        backgroundColor: "var(--mcgill-red)",
      }}
    />
  );
};

export default UserSession;
