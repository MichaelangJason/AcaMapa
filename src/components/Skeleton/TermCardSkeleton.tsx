import Image from "next/image";
import CourseSkeleton from "./CourseSkeleton";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css"

const TermCardSkeleton = (props: {
  coursesConfig?: {
    numCourseTag: number;
    numNotes: number;
  }[][]
}) => {
  const { coursesConfig = [] } = props;

  return (
    <div className="term">
      {/* term header */}
      <div className={`term-header`}>
        <Skeleton width={100} />
        <Image className="delete-icon" src="delete.svg" alt="delete" width={20} height={20} />
      </div>
      <div className={"term-body overflow-hidden"}>
        {/* courses */}
        {coursesConfig.map((config, idx) => {
          return <CourseSkeleton key={'mock-course-' + idx} subsectionConfig={config} />
        })}
      </div>
      {/* term footer */}
      <div className="term-footer">
        <Skeleton width={100} />
      </div>
    </div>
  )
}

export default TermCardSkeleton