"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import ItemTag from "./ItemTag";
import { useCallback, useMemo } from "react";
import { I18nKey, Language, t } from "@/lib/i18n";
import { useAppSelector } from "@/store/hooks";

const UserSession = () => {
  const { data: session } = useSession();
  const lang = useAppSelector((state) => state.userData.lang) as Language;

  const item = useMemo(() => {
    if (session) {
      return [t([I18nKey.LOGOUT], lang)];
    }
    return [];
  }, [session, lang]);

  const handleClickItem = useCallback(
    (item: string) => {
      if (item === t([I18nKey.LOGOUT], lang)) {
        signOut();
      } else {
        signIn();
      }
    },
    [lang],
  );

  return (
    <ItemTag
      items={item}
      title={session?.user?.email ?? t([I18nKey.LOGIN_WITH_MCGILL_EMAIL], lang)}
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
