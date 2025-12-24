import { Tooltip } from "react-tooltip";
import { TooltipId } from "@/lib/enums";
import { useAppSelector } from "@/store/hooks";

const Tooltips = () => {
  const isInitialized = useAppSelector((state) => state.global.isInitialized);

  return (
    <div className="tooltip-container">
      {Object.values(TooltipId).map((id) => (
        // default to top
        <Tooltip
          id={id}
          place="top"
          className="tooltip-common"
          key={id}
          hidden={!isInitialized}
        />
      ))}
    </div>
  );
};

export default Tooltips;
