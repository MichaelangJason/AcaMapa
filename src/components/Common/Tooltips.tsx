import { Tooltip } from "react-tooltip";
import { TooltipId } from "@/lib/enums";

const Tooltips = () => {
  return (
    <div className="tooltip-container">
      {/* <Tooltip anchorSelect=".future-icon" place="top" content="Subsequent Courses" style={{ zIndex: 10000 }}/>
      <Tooltip anchorSelect=".expand-icon" place="top" content="Expand" style={{ zIndex: 10000 }}/>
      <Tooltip anchorSelect=".delete-course" place="top" content="Delete Course" style={{ zIndex: 10000 }}/>
      <Tooltip anchorSelect=".course-button" place="right" delayShow={500} content="Click to add to term" style={{ zIndex: 10000 }}/>
      <Tooltip anchorSelect=".add-term-button" place="left" delayShow={500} content="Click to add a new term" style={{ zIndex: 10000 }}/>
      <Tooltip id={TooltipId.SATISFIED_COURSE} place="top" style={{ zIndex: 10000 }}/>
      <Tooltip id={TooltipId.UNSATISFIED_COURSE} place="top" style={{ zIndex: 10000 }}/>
      <Tooltip id={TooltipId.TAKEN_COURSE} place="top" style={{ zIndex: 10000 }}/> */}
      <Tooltip
        id={TooltipId.REQ_NOTES_TAG}
        place="top"
        className="tooltip-common"
      />
      <Tooltip
        id={TooltipId.CREDIT_MAP_TAG}
        place="top"
        className="tooltip-common"
      />
    </div>
  );
};

export default Tooltips;
