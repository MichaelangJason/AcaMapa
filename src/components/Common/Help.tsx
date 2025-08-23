import { TooltipId } from "@/lib/enums";
import { Language, t, I18nKey } from "@/lib/i18n";
import HelpIcon from "@/public/icons/help.svg";
import { useAppSelector } from "@/store/hooks";

const Help = ({ callback }: { callback: () => void }) => {
  const lang = useAppSelector((state) => state.userData.lang) as Language;
  return (
    <section
      className="help-container clickable"
      data-tooltip-id={TooltipId.HELP}
      data-tooltip-content={t([I18nKey.FAQ], lang)}
      data-tooltip-place="bottom"
      onClick={callback}
    >
      <HelpIcon />
    </section>
  );
};

export default Help;
