import '@/styles/utilityBar.scss';
import { CourseTag } from "@/components/Course";
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useMemo, useState } from 'react';
import { CourseTagType } from '@/utils/enums';
import Image from 'next/image';
import { shallowEqual } from 'react-redux';
import DropdownMenu from './DropdownMenu';
import InfoModal from './InfoModal';

const UtilityBar = () => {
  const inTermCourseIds = useSelector((state: RootState) => state.terms.inTermCourseIds || [], shallowEqual);
  const courseTaken = useSelector((state: RootState) => state.courseTaken || [], shallowEqual);
  const initialCourses = useSelector((state: RootState) => state.global.initCourses || [], shallowEqual);
  const isSideBarExpanded = useSelector((state: RootState) => state.global.isSideBarExpanded);
  const isAssitantExpanded = useSelector((state: RootState) => state.global.isAssistantExpanded);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  const inTermCredits = useMemo(() => {
    return initialCourses.reduce((acc, course) => {
      if (course.credits > 0 && inTermCourseIds.includes(course.id)) {
        return acc + course.credits;
      }
      return acc;
    }, 0);
  }, [initialCourses, inTermCourseIds]);

  const takenCredits = useMemo(() => {
    const courseIds = Object.values(courseTaken).flat()
    return initialCourses.reduce((acc, course) => {
      if (course.credits > 0 && courseIds.includes(course.id)) {
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
    <div className={`utility-bar ${isSideBarExpanded ? 'sidebar-expanded' : ''} ${isAssitantExpanded ? 'assistant-expanded' : ""}`}>
      <DropdownMenu 
        setIsAboutModalOpen={setIsAboutModalOpen} 
        setIsTutorialModalOpen={setIsInfoModalOpen} 
      />
      
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
      <div className="utility-bar-link" onClick={() => setIsInfoModalOpen(true)}>Tutorial</div>
      <div className="utility-bar-link" onClick={() => setIsAboutModalOpen(true)}>About</div>
      <Image 
        src="/github-mark.svg" 
        alt="github" 
        width={20} 
        height={20} 
        style={{ cursor: 'pointer', justifySelf: 'flex-end' }} 
        onClick={() => window.open('https://github.com/MichaelangJason/Course-Planner', '_blank')}
      />
      {isAboutModalOpen && (
        <InfoModal tabs={[
          {
            title: 'About',
            src: '/about.md'
          }
        ]} onClose={() => setIsAboutModalOpen(false)} />
      )}
      {isInfoModalOpen && (
        <InfoModal tabs={[
          {
            title: 'Tutorial',
            src: '/tutorial.md'
          }
        ]} onClose={() => setIsInfoModalOpen(false)} />
      )}
    </div>
  )
}

export default UtilityBar;