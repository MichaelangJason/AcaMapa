import { Draggable } from "@hello-pangea/dnd";
import { memo, useMemo, useState } from "react";
import "@/styles/course.scss";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { deleteCourseFromTerm } from "@/store/termSlice";
import { toast } from "react-toastify";
import { IGroup } from "@/types/course";
import { isSatisfied, parseGroup } from "@/utils";
import { ReqTitle } from "@/utils/enums";
import PreCoReq from "./PreCoReq";
import OtherReq from "./OtherReq";
import { setCourseExpanded, setCourseMounted } from "@/store/courseSlice";
import "@/styles/course.scss";
import { setSeekingInfo } from "@/store/globalSlice";
import { smoothScrollTo } from "@/utils";
export interface CourseCardProps {
  termId: string;
  courseId: string;
  index: number;
}

const useIsSatisfied = (termId: string, prerequisites: IGroup, restrictions: IGroup, corequisites: IGroup) => {
  const terms = useSelector((state: RootState) => state.terms);
  const courseTaken = useSelector((state: RootState) => state.courseTaken);
  const initCourses = useSelector((state: RootState) => state.global.initCourses);
  
  return useMemo(() => {
    
    return isSatisfied({
      prerequisites, 
      restrictions, 
      corequisites, 
      courseTaken: Object.values(courseTaken).flat(), 
      terms, 
      termId, 
      initCourses
    });
  },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [terms, termId, courseTaken]
  );
}

const CourseCard = (props: CourseCardProps) => {
  const { termId, courseId, index } = props;
  const course = useSelector((state: RootState) => state.courses[courseId]);
  const { 
    name, 
    id, 
    credits, 
    prerequisites, 
    restrictions, 
    corequisites,
    futureCourses,
    notes
  } = course;
  const dispatch = useDispatch();
  const isExpanded = useSelector((state: RootState) => state.courses[courseId].isExpanded);
  const [isRemoving, setIsRemoving] = useState(false);
  const isMounted = useSelector((state: RootState) => state.courses[courseId].isMounted); // for styling
  const { seekingId, seekingTerm } = useSelector((state: RootState) => state.global.seekingInfo);
  const isSeeking = seekingId !== undefined && seekingTerm !== undefined;
  const isSeekingSelf = seekingId === courseId && seekingTerm === termId;
  const termIdx = useSelector((state: RootState) => state.terms.order.indexOf(termId));
  // const [isMoving, setIsMoving] = useState(isMounted); // for styling during drag

  const handleRemoveCourse = () => {
    setIsRemoving(true);
    if (isSeekingSelf) dispatch(setSeekingInfo({ }));
    setTimeout(() => {
      dispatch(deleteCourseFromTerm({ termId, courseId }));
      dispatch(setCourseMounted({ courseId: id, isMounted: false }))
      dispatch(setCourseExpanded({ courseId, isExpanded: true })) // default to expanded
      toast.success(`${courseId} removed`);
    }, 200);
  }

  const handleCoursePageJump = () => {
    // open course page in new tab
    const domain = process.env.NEXT_PUBLIC_SCHOOL_DOMAIN;
    const academicYear = process.env.NEXT_PUBLIC_ACADEMIC_YEAR;
    const endpoint = process.env.NEXT_PUBLIC_SCHOOL_ENDPOINT?.replace(/ACADEMIC_YEAR/i, academicYear || "");
    const id = courseId.replace(" ", "-").toLowerCase();
    window.open(`${domain}${endpoint}${id}`, "_blank");
  }

  const subsectionCheck = useMemo(() => {
    const hasPrereq = prerequisites && prerequisites.raw !== "";
    const hasAntiReq = restrictions && restrictions.raw !== "";
    const hasCoReq = corequisites && corequisites.raw !== "";
    const hasNotes = notes && notes.length > 0;
    const hasFutureCourses = futureCourses && futureCourses.length > 0;

    return {
      hasPrereq,
      hasAntiReq,
      hasCoReq,
      hasNotes,
      hasFutureCourses,
      hasSubsection: hasPrereq || hasAntiReq || hasCoReq || hasNotes,
    };
  }, [prerequisites, restrictions, corequisites, notes, futureCourses]);

  const { hasPrereq, hasAntiReq, hasCoReq, hasNotes, hasFutureCourses, hasSubsection } = subsectionCheck;
  const handleExpand = () => {
    if (hasSubsection) {
      dispatch(setCourseExpanded({courseId, isExpanded: !isExpanded}));
    }
  }
  const isSatisfied = useIsSatisfied(
    termId, 
    parseGroup(prerequisites!.parsed), 
    parseGroup(restrictions!.parsed), 
    parseGroup(corequisites!.parsed)
  );

  const handleSeekFutureCourses = async () => {
    if (!hasFutureCourses) {
      toast.error(`No future courses found for ${id}`);
      return;
    };
    if (isSeekingSelf) dispatch(setSeekingInfo({ }));
    else {
      if (!isExpanded) {
        dispatch(setCourseExpanded({ courseId, isExpanded: true }));
        await new Promise(resolve => setTimeout(resolve, 30));
      }
      dispatch(setSeekingInfo({ seekingId: courseId, seekingTerm: termId })); // set to seeking state

      const body = document.body;
      const sidebar = document.getElementById("sidebar");
      const term = document.getElementById(termId);
      const course = document.getElementById(courseId);
      
      const MARGIN_WIDTH = 50;
      const MARGIN_HEIGHT = 9; // a buffer to make sure the course is visible

      
      if (!term || !course || !body || !sidebar) return;
      const termBody = term!.querySelector(".term-body")!;
      
      const sidebarRect = sidebar.getBoundingClientRect();
      const bodyRect = body.getBoundingClientRect();
      const termRect = term.getBoundingClientRect();
      const termBodyRect = termBody.getBoundingClientRect();
      const courseRect = course.getBoundingClientRect();
      
      // scroll course into view if needed
      const isCutOffAtTop = courseRect.top < termBodyRect.top;
      const isCutOffAtBottom = courseRect.bottom > termBodyRect.bottom;
      // scroll term into view if needed
      const isCutOffAtLeft = termRect.left < sidebarRect.right;
      const isCutOffAtRight = termRect.right > (window.innerWidth - termRect.width - 2*MARGIN_WIDTH);

      // simply showing case
      if (!isCutOffAtTop && !isCutOffAtBottom && !isCutOffAtLeft && !isCutOffAtRight) {
        setTimeout(() => {
          dispatch(setSeekingInfo({ isReadyToShow: true }));
        }, 300);
        return;
      }

      const isScrollTerm = isCutOffAtTop || isCutOffAtBottom;
      const isScrollWindow = isCutOffAtLeft || isCutOffAtRight;

      if (isScrollWindow) {
        console.log("is cutting off at: ", isCutOffAtLeft ? "left" : "right");
        const scrollOffset = isCutOffAtLeft
          ? termRect.left - sidebarRect.right - MARGIN_WIDTH
          : termRect.right - window.innerWidth + termRect.width + 2*MARGIN_WIDTH;

        console.log("termRect.left", termRect.left);
        console.log("sidebarRect.right", sidebarRect.right);
        console.log("marginWidth", MARGIN_WIDTH);
        console.log("bodyRect.right", bodyRect.right);
        
        const scrollLeft = window.scrollX || document.documentElement.scrollLeft || document.body.scrollLeft;
        const targetX = scrollLeft + scrollOffset;

        console.log('document.documentElement.scrollLeft', document.documentElement.scrollLeft);
        console.log('scrollOffset', scrollOffset);
        console.log('targetX', targetX);
        // Calculate duration based on horizontal distance
        const distance = Math.abs(targetX - window.scrollX);
        const duration = Math.min(Math.max(distance / 2, 300), 1000);
        
        // await new Promise(resolve => setTimeout(resolve, duration));
        smoothScrollTo({
          container: window,
          targetX,
          duration,
          onComplete: () => {
            console.log('Window scroll completed');

            if (!isScrollTerm) {
              dispatch(setSeekingInfo({ isReadyToShow: true }));
            }
          }
        });
        if (isScrollTerm) await new Promise(resolve => setTimeout(resolve, duration));
      }

      if (isScrollTerm) {
        const scrollOffset = isCutOffAtTop 
          ? courseRect.top - termBodyRect.top - MARGIN_HEIGHT
          : courseRect.bottom - termBodyRect.bottom + MARGIN_HEIGHT;

        const targetY = Math.max(0, Math.min(
          termBody.scrollTop + scrollOffset, 
          termBody.scrollHeight - termBody.clientHeight
        ));

        // Calculate duration based on vertical distance
        const distance = Math.abs(targetY - termBody.scrollTop);
        const duration = Math.min(Math.max(distance / 2, 200), 600); // Slightly shorter max duration for term body

        smoothScrollTo({
          container: termBody as HTMLElement,
          targetY,
          duration,
          onComplete: () => {
            console.log('Term scroll completed');
            setTimeout(() => {
              dispatch(setSeekingInfo({ isReadyToShow: true }));
            }, 100);
          }
        });
      }
    }
  }

  // remove moving class after 100ms for animation
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     setIsMoving(false);
  //   }, 100);
  //   return () => clearTimeout(timer);
  // }, []);

  return (
    <Draggable draggableId={courseId} index={index} isDragDisabled={isSeeking}>
      {(provided, snapshot) => {

        const classNames = 'course-card-container' 
                        + (!isMounted ? ' fade-in' : '') 
                        + (isExpanded ? " in-term" : " in-term-folded") 
                        + (isSatisfied ? " satisfied" : " unsatisfied") 
                        + (isRemoving ? ' fade-out' : '')
                        + (snapshot.isDragging ? ' moving' : '')
                        + (isSeekingSelf ? ' seeking' : '');
        return (
        <div
          className={classNames}
          id={courseId}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <div className="course-button-container in-term">
            <div 
              className={`hot-zone ${snapshot.isDragging ? "disabled" : ""} ${isSeekingSelf ? "seeking" : ""}`} 
              onClick={handleSeekFutureCourses}
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
              className={`hot-zone ${snapshot.isDragging ? "disabled" : ""}`}
              onClick={handleExpand}
              title={hasSubsection ? "Expand" : "No Subsection"}
            >
              <Image
                src="/expand-single.svg"
                alt="Expand"
                width={12}
                height={12}
                className={`expand-icon ${isExpanded ? "expanded" : ""}`}
              />
            </div>
            <div 
              className={`hot-zone ${snapshot.isDragging ? "disabled" : ""}`} 
              onClick={handleRemoveCourse}
              title={"Delete Course"}
            >
              <Image
                src="/delete.svg"
                alt="Delete Course"
                width={10}
                height={10}
                className="delete"
              />
            </div>
          </div>
          <div className={`course-card-info-basic`}>
            <div className="name in-term">{name}</div>
            <div 
              className="id-credits" 
              onClick={handleCoursePageJump}
              title="Go to course page"
            >
              {credits < 0 ? <b>{id}</b> : <><b>{id}</b> ({credits} credits)</>}
            </div>
          </div>
          {/* Subsections */}
          {isExpanded && hasPrereq && <PreCoReq
            parsed={prerequisites!.parsed}
            raw={prerequisites!.raw}
            termId={termId}
            title={ReqTitle.PRE_REQ}
            isMoving={snapshot.isDragging}
          />}
          {isExpanded && hasCoReq && <PreCoReq
            parsed={corequisites!.parsed}
            raw={corequisites!.raw}
            termId={termId}
            title={ReqTitle.CO_REQ}
            isMoving={snapshot.isDragging}
          />}
          {isExpanded && hasAntiReq && <OtherReq
            parsed={restrictions!.parsed}
            notes={[restrictions!.raw]}
            termId={termId}
            title={ReqTitle.ANTI_REQ}
            isMoving={snapshot.isDragging}
          />}
          {isExpanded && hasNotes && <OtherReq
            notes={notes}
            termId={termId}
            title={ReqTitle.NOTES}
            isMoving={snapshot.isDragging}
          />}
          {isExpanded && !hasSubsection && <div className="no-subsection">No Subsection</div>}
        </div>
      )}}
    </Draggable>
  );
};

export default memo(CourseCard);