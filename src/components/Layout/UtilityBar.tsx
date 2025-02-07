import '@/styles/utilityBar.scss';
import { CourseTag } from "@/components/Course";
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useMemo } from 'react';
import { CourseTagType } from '@/utils/enums';
import Image from 'next/image';
import { useDispatch, shallowEqual } from 'react-redux';
import { setIsTutorialModalOpen, setIsAboutModalOpen } from '@/store/slices/globalSlice';
import DropdownMenu from './DropdownMenu';

const UtilityBar = () => {
  const inTermCourseIds = useSelector((state: RootState) => state.terms.inTermCourseIds || [], shallowEqual);
  const courseTaken = useSelector((state: RootState) => state.courseTaken || [], shallowEqual);
  const initialCourses = useSelector((state: RootState) => state.global.initCourses || [], shallowEqual);
  const isSideBarExpanded = useSelector((state: RootState) => state.global.isSideBarExpanded);
  const dispatch = useDispatch();

  const toggleTutorialModal = () => {
    dispatch(setIsTutorialModalOpen(true));
  }

  const toggleAboutModal = () => {
    dispatch(setIsAboutModalOpen(true));
  }

  const inTermCredits = useMemo(() => {
    return initialCourses.reduce((acc, course) => {
      if (inTermCourseIds.includes(course.id)) {
        return acc + course.credits;
      }
      return acc;
    }, 0);
  }, [initialCourses, inTermCourseIds]);

  const takenCredits = useMemo(() => {
    const courseIds = Object.values(courseTaken).flat()
    return initialCourses.reduce((acc, course) => {
      if (course.credits > 0 &&courseIds.includes(course.id)) {
        return acc + course.credits;
      }
      return acc;
    }, 0);
  }, [courseTaken, initialCourses]);

  const totalCredits = inTermCredits + takenCredits;
  const totalCreditsString = "Total Credits: " + totalCredits + " (" + inTermCredits + " in term, " + takenCredits + " taken)";

  // const takenCourses = Object.values(courseTaken).flat();
  // const totalCourses = inTermCourseIds.length + takenCourses.length;
  const totalCoursesString = "Total Courses Planned: " + inTermCourseIds.length

  const info = [
    totalCreditsString,
    totalCoursesString
  ]

  return (
    <div className={`utility-bar ${isSideBarExpanded ? '' : 'full'}`}>
      <DropdownMenu />
      
      {info.map((info, index) => (
        <CourseTag 
          key={index}
          courseId={info} 
          type={CourseTagType.UTILITY} 
          itExists={true} 
          isMoving={false} 
          disabled={true}
          style={{
            backgroundColor: 'var(--utility-bar-course-tag-bg-color)',
            color: 'white',
            fontSize: '15px',
            borderRadius: '7px',
            // padding: '3px 5px'
            cursor: 'default',
            padding: '0px 6px 0px 6px',
            // fontWeight: 'normal'
          }}
      />
      ))}
      <div className="flex-grow"/>
      <div className="utility-bar-link" onClick={toggleTutorialModal}>Tutorial</div>
      <div className="utility-bar-link" onClick={toggleAboutModal}>About</div>
      <Image 
        src="/github-mark.svg" 
        alt="github" 
        width={20} 
        height={20} 
        style={{ cursor: 'pointer', justifySelf: 'flex-end' }} 
        onClick={() => window.open('https://github.com/MichaelangJason/Course-Planner', '_blank')}
      />
    </div>
  )
}

export default UtilityBar;