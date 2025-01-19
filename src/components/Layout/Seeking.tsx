import { RootState } from "@/store";
import { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { CourseResult } from "@/components/Course";
import { setSearchInput, setSeekingInfo } from "@/store/slices/globalSlice";
import { motion } from "motion/react";
import { IRawCourse } from "@/db/schema";

const useSeeking = (seekingId: string | null) => {
  const courses = useSelector((state: RootState) => state.courses);
  const initCourses = useSelector((state: RootState) => state.global.initCourses);
  
  return useMemo(() => {

    if (!seekingId) return null;
    const course = courses[seekingId];
    const { futureCourses } = course;
    return initCourses.filter((course) => futureCourses!.includes(course.id));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seekingId]); // no need change for courses/initCourses change
}

const Seeking = () => {
  const seekingInfo = useSelector((state: RootState) => state.global.seekingInfo);
  const { seekingId, seekingTerm, isReadyToShow } = seekingInfo;
  const [top, setTop] = useState<number>(0);
  const [maxHeight, setMaxHeight] = useState<number>(0);
  const [isPositioned, setIsPositioned] = useState(false);
  const courseCardWidth = window.getComputedStyle(document.documentElement).getPropertyValue('--course-card-width');
  const placeholderWidth = parseInt(courseCardWidth) + 6;

  const futureCourses = useSeeking(seekingId!);
  const isSeeking = !!futureCourses;
  const dispatch = useDispatch();

  const handleAddCourse = (course: IRawCourse) => {
    dispatch(setSeekingInfo({ })); // clear seeking info
    dispatch(setSearchInput(course.id));
  }

  useEffect(() => {
    if (!isReadyToShow) {
      setIsPositioned(false);
      return;
    }

    const course = document.getElementById(seekingId!);
    const termBody = document.getElementById(seekingTerm!)?.querySelector(".term-body");
    if (!course || !termBody) {
      dispatch(setSeekingInfo({ }));
      return;
    };
    const computedStyle = window.getComputedStyle(document.documentElement);
    const courseRect = course.getBoundingClientRect();
    const termBodyRect = termBody.getBoundingClientRect();
    const utilityBarHeight = parseInt(computedStyle.getPropertyValue('--utility-bar-height'));
    const marginTop = parseInt(computedStyle.getPropertyValue('--terms-padding-bottom')) + utilityBarHeight;
    const SHADOW_HEIGHT = 10;

    setMaxHeight(termBodyRect.bottom - courseRect.top);
    setTop(course.getBoundingClientRect().top - marginTop - SHADOW_HEIGHT);
    setIsPositioned(true);
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReadyToShow]);

  if (!isSeeking) return null;

  return (
    <>
      {isReadyToShow && isPositioned 
        ? <motion.div 
          key="seeking-container"
          id="seeking" 
          className="seeking-container" 
          style={{ top, maxHeight }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          {futureCourses?.map((course) => (
            <CourseResult key={course.id} {...course} cb={() => handleAddCourse(course)} />
          ))}
          </motion.div>
        : <motion.div
            key="seeking-placeholder-box"
            className="seeking-placeholder-box"
            initial={{ width: 0 }}
            animate={{ width: placeholderWidth }}
            exit={{ width: 0 }}
            transition={{ duration: 0.25 }}
          />}
    </>
  )
    
}

export default Seeking;