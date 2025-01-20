import Skeleton from "react-loading-skeleton";
import Image from "next/image";
import 'react-loading-skeleton/dist/skeleton.css'
import { Constants } from "@/utils/enums";
import ReqSkeleton from "./ReqSkeleton";

const CourseSkeleton = (props: {
  subsectionConfig?: {
    numCourseTag: number; 
    numNotes: number;
  }[]
}) => {
  const width = Constants.MOCK_IN_TERM_WIDTH;
  const { subsectionConfig = [] } = props;

  return (
    <div
      className="course-card-container in-term"
    >
      <div className="course-button-container in-term">
        <div
          className={`hot-zone disabled`}
          title={"Seek Future Courses"}
        >
          <Image
            src="/telescope-eve-2.svg"
            alt="seek future courses"
            width={12}
            height={12}
            className={`future-icon`}
          />
        </div>
        <div
          className={`hot-zone disabled`}
        >
          <Image
            src="/expand-single.svg"
            alt="Expand"
            width={12}
            height={12}
            className={`expand-icon expanded`}
          />
        </div>
        <div
          className={`hot-zone disabled`}
          title={"Delete Course"}
        >
          <Image
            src="/delete.svg"
            alt="Delete Course"
            width={10}
            height={10}
            className="delete-icon"
          />
        </div>
      </div>
      <div className={`course-card-info-basic`}>
        <div className="name in-term">
          <Skeleton width={width}/>
        </div>
        <div
          className="id-credits"
          title="Go to course page"
        >
          <Skeleton width={width}/>
        </div>
      </div>
      {/* Subsections */}
      {subsectionConfig.map((val, idx) => {
        const { numCourseTag, numNotes } = val;
        return <ReqSkeleton key={"mock-req-"+idx} numCourseTag={numCourseTag} numNotes={numNotes}/>
      })}
    </div>
  )
}

export default CourseSkeleton;