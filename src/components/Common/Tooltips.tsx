import { Tooltip } from "react-tooltip";
import { TooltipId } from "@/lib/enums";

const Tooltips = () => {
  return (
    <div className="tooltip-container">
      <Tooltip id={TooltipId.TOP} place="top" className="tooltip-common" />
      <Tooltip
        id={TooltipId.BOTTOM}
        place="bottom"
        className="tooltip-common"
      />
      <Tooltip id={TooltipId.RIGHT} place="right" className="tooltip-common" />
      <Tooltip id={TooltipId.LEFT} place="left" className="tooltip-common" />
      <Tooltip id={TooltipId.SYNC} place="bottom" className="tooltip-common" />
      <Tooltip id={TooltipId.LANG} place="bottom" className="tooltip-common" />
    </div>
  );
};

export default Tooltips;
