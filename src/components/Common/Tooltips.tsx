import { Tooltip } from "react-tooltip"

const Tooltips = () => {
  return (
    <>
      <Tooltip anchorSelect=".delete-icon" place="top" content="delete" delayShow={500} style={{ zIndex: 10000 }}/>
      <Tooltip anchorSelect=".future-icon" place="top" content="future" delayShow={500} style={{ zIndex: 10000 }}/>
      <Tooltip anchorSelect=".expand-icon" place="top" content="expand" delayShow={500} style={{ zIndex: 10000 }}/>
    </>
  )
}

export default Tooltips;