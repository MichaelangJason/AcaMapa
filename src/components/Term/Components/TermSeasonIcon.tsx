import { Season } from "@/lib/enums";
import WinterIcon from "@/public/icons/winter.svg";
import SummerIcon from "@/public/icons/summer.svg";
import FallIcon from "@/public/icons/fall.svg";
import NotOfferedIcon from "@/public/icons/not-offered.svg";

const TermSeasonIcon = ({ termSeason }: { termSeason: Season }) => {
  if (termSeason === Season.WINTER) {
    return <WinterIcon className="term-season-icon" />;
  } else if (termSeason === Season.SUMMER) {
    return <SummerIcon className="term-season-icon" />;
  } else if (termSeason === Season.FALL) {
    return <FallIcon className="term-season-icon" />;
  } else {
    return <NotOfferedIcon className="term-season-icon" />;
  }
};

export default TermSeasonIcon;
