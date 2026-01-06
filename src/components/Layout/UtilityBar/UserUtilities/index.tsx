"use client";
import Help from "./Help";
import Sync from "./Sync";
import UserLang from "./UserLang";
import Survey from "./Survey";
import ItemTagSkeleton from "@/components/Skeleton/ItemTagSkeleton";
import { TooltipId } from "@/lib/enums";
import { Language, t, I18nKey } from "@/lib/i18n";
import { useAppSelector } from "@/store/hooks";
import GithubMark from "@/public/icons/github-mark.svg";
import clsx from "clsx";

const UserUtilities = () => {
  const isInitialized = useAppSelector((state) => state.global.isInitialized);
  const lang = useAppSelector((state) => state.userData.lang) as Language;

  return (
    <section className={clsx("contents", !isInitialized && "skeleton")}>
      {/* contents: Help, Sync, UserLang, GithubMark */}

      {/* skeleton loading */}
      {!isInitialized ? (
        // render skeleton loading
        <>
          <ItemTagSkeleton width="2" />
          <ItemTagSkeleton width="2" />
        </>
      ) : (
        // render contents
        <>
          {/* survey */}
          <Survey />

          {/* help modal */}
          <Help />

          {/* local/remote sync status */}
          <Sync />

          {/* user language */}
          <UserLang />
        </>
      )}

      {/* github mark */}
      <GithubMark
        className="github-mark"
        data-tooltip-id={TooltipId.UTILITY_BAR}
        data-tooltip-content={t([I18nKey.GITHUB_MARK], lang)}
        data-tooltip-place="bottom"
        data-tooltip-delay-show={500}
        onClick={() => {
          window.open("https://github.com/MichaelangJason/AcaMapa", "_blank");
        }}
      />
    </section>
  );
};

export default UserUtilities;
