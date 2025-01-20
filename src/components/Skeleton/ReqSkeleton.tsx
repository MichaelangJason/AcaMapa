import Skeleton from "react-loading-skeleton";
import 'react-loading-skeleton/dist/skeleton.css'


const ReqSkeleton = (props: {
  numCourseTag: number;
  numNotes: number;
}) => {
  const { numCourseTag, numNotes } = props;

  // does not display contents for now (Skeleton no width
  return (
    <div className="course-req-notes-container">
      <div className="title">
        <Skeleton />
      </div>
        <div className="course-ids">
          {Array(numCourseTag).map((_, idx) =>
            <Skeleton key={"mock-course-tag-"+idx}/>
          )}
        </div>
      
        <ul className="notes">
          {/* filter out instructor and term notes for now*/}
          {Array(numNotes).map((_, idx) => 
            <li key={idx}>
              <Skeleton key={"mock-notes-"+idx}/>
            </li>
          )}
        </ul>
    </div>
  )
}

export default ReqSkeleton;