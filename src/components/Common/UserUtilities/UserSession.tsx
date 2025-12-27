"use client";

/* eslint-disable @typescript-eslint/no-unused-vars */
import ItemTag from "@/components/Common/ItemTag";
import { useCallback, useMemo } from "react";
import { I18nKey, Language, t } from "@/lib/i18n";
import { useAppSelector } from "@/store/hooks";
import { TooltipId } from "@/lib/enums";
import { redirect } from "next/navigation";

const UserSession = () => {
  const lang = useAppSelector((state) => state.userData.lang) as Language;

  // const item = useMemo(() => {
  //   if (session) {
  //     return [t([I18nKey.LOGOUT], lang)];
  //   }
  //   return [];
  // }, [session, lang]);

  // const handleClickItem = useCallback(
  //   (item: string) => {
  //     if (item === t([I18nKey.LOGOUT], lang)) {
  //       signOut();
  //     } else {
  //       signIn();
  //     }
  //   },
  //   [lang],
  // );

  return (
    <ItemTag
      items={[]}
      title={t([I18nKey.LOGIN_WITH_MCGILL_EMAIL], lang)}
      isPinnable={false}
      className="user-session-tag"
      tooltipProps={{
        "data-tooltip-id": TooltipId.USER_SESSION,
        "data-tooltip-content": t([I18nKey.UNDER_CONSTRUCTION], lang),
        "data-tooltip-delay-show": 0,
        "data-tooltip-place": "bottom",
      }}
    />
  );
};

export default UserSession;
