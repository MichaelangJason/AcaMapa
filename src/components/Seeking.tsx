import { RootState } from "@/store";
import { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { CourseResult } from "@/components/Course/CourseResult";
import { setSearchInput, setSeekingInfo } from "@/store/globalSlice";
import { Course } from "@/types/course";
import { motion } from "framer-motion";

const useSeeking = (seekingId: string | null) => {
  const courses = useSelector((state: RootState) => state.courses);
  const initCourses = useSelector((state: RootState) => state.global.initCourses);
  
  return useMemo(() => {

    if (!seekingId) return null;
    const course = courses[seekingId];
    const { futureCourses } = course;
    return initCourses.filter((course) => futureCourses!.includes(course.id));
  }, [seekingId]);
}

const Seeking = () => {
  const seekingInfo = useSelector((state: RootState) => state.global.seekingInfo);
  const { seekingId, seekingTerm, isReadyToShow } = seekingInfo;
  const [top, setTop] = useState<number>(0);
  const [maxHeight, setMaxHeight] = useState<number>(0);
  const [isPositioned, setIsPositioned] = useState(false);

  const futureCourses = useSeeking(seekingId!);
  const isSeeking = !!futureCourses;
  if (!isSeeking) return null;

  const dispatch = useDispatch();

  const handleAddCourse = (course: Course) => {
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
    
    const courseRect = course.getBoundingClientRect();
    const termBodyRect = termBody.getBoundingClientRect();
    setMaxHeight(termBodyRect.bottom - courseRect.top);
    setTop(course.getBoundingClientRect().top);
    setIsPositioned(true);
    
  }, [isReadyToShow]);



  return (
    <>
      {isReadyToShow && isPositioned 
        ? <motion.div 
          id="seeking" 
          className="seeking-container" 
          style={{ top, maxHeight }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {futureCourses?.map((course) => (
            <CourseResult key={course.id} {...course} additionalFn={() => handleAddCourse(course)} />
          ))}
          </motion.div>
        : <div className="seeking-placeholder-box" />}
    </>
  )
    
}

export default Seeking;