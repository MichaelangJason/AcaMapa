
import { Constants } from '@/utils/enums';
import Image from 'next/image'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

const CourseResultSkeleton = () => {
  const width =  Constants.MOCK_RESULT_WIDTH;

  return (
    <div className={`course-card-container result`}>
      <div className="course-card-info-basic">
        <div className="name">
          <Skeleton width={width}/>
        </div>
        <div 
          className="id-credits" 
          title="Go to course page"
        >
          <Skeleton width={width} />
        </div>
      </div>
      <div className="course-button-container in-search disabled">
          <Image 
            src="/cross.svg" 
            alt="Add Course" 
            width={15} 
            height={15} 
            className="course-button"
          />
        </div>
    </div>
  )
}

export default CourseResultSkeleton
