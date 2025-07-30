import { Tooltip } from "react-tooltip";
import { TooltipId } from "@/lib/enums";

const Tooltips = () => {
  return (
    <div className="tooltip-container">
      {Object.values(TooltipId).map((id) => (
        // default to top
        <Tooltip id={id} place="top" className="tooltip-common" key={id} />
      ))}
    </div>
  );
};

export default Tooltips;
