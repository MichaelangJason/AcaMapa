import { Help, Sync, UserLang } from "@/components/Common/UserUtilities";
import ItemTagSkeleton from "@/components/Skeleton/ItemTagSkeleton";
import { TooltipId } from "@/lib/enums";
import { Language, t, I18nKey } from "@/lib/i18n";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setIsInfoModalOpen } from "@/store/slices/localDataSlice";
import GithubMark from "@/public/icons/github-mark.svg";

const UserUtilities = () => {
  const isInitialized = useAppSelector((state) => state.global.isInitialized);
  const dispatch = useAppDispatch();
  const lang = useAppSelector((state) => state.userData.lang) as Language;

  return (
    <section className="contents">
      {/* contents: Help, Sync, UserSession, UserLang, GithubMark */}

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
          {/* help modal */}
          <Help
            callback={() => {
              dispatch(setIsInfoModalOpen(true));
            }}
          />

          {/* local/remote sync status */}
          <Sync />

          {/* user session login/logout */}
          {/* <UserSession /> */}

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
