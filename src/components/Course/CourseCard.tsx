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
import { GroupType, ReqTitle } from "@/utils/enums";
import PreCoReq from "./PreCoReq";
import OtherReq from "./OtherReq";
import { setCourseExpanded, setCourseMounted } from "@/store/courseSlice";

export interface CourseCardProps {
  termId: string;
  courseId: string;
  index: number;
}

const useIsSatisfied = (termId: string, prerequisites: IGroup, restrictions: IGroup, corequisites: IGroup) => {
  const terms = useSelector((state: RootState) => state.terms);
  const initCourses = useSelector((state: RootState) => state.global.initCourses);
  const courseTaken = useSelector((state: RootState) => Object.values(state.courseTaken).flat());
  
  return useMemo(() => 
    isSatisfied({prerequisites, restrictions, corequisites, courseTaken, terms, termId, initCourses}),
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
    notes
  } = course;
  const dispatch = useDispatch();
  const isExpanded = useSelector((state: RootState) => state.courses[courseId].isExpanded);
  const [isRemoving, setIsRemoving] = useState(false);
  const isMounted = useSelector((state: RootState) => state.courses[courseId].isMounted); // for styling 
  // const [isMoving, setIsMoving] = useState(isMounted); // for styling during drag

  const handleRemoveCourse = () => {
    setIsRemoving(true);
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

    return {
      hasPrereq,
      hasAntiReq,
      hasCoReq,
      hasNotes,
      hasSubsection: hasPrereq || hasAntiReq || hasCoReq || hasNotes
    };
  }, [prerequisites, restrictions, corequisites, notes]);

  const { hasPrereq, hasAntiReq, hasCoReq, hasNotes, hasSubsection } = subsectionCheck;
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

  // remove moving class after 100ms for animation
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     setIsMoving(false);
  //   }, 100);
  //   return () => clearTimeout(timer);
  // }, []);

  return (
    <Draggable draggableId={courseId} index={index}>
      {(provided, snapshot) => {

        const classNames = 'course-card-container' 
                        + (!isMounted ? ' fade-in' : '') 
                        + (isExpanded ? " in-term" : " in-term-folded") 
                        + (isSatisfied ? " satisfied" : " unsatisfied") 
                        + (isRemoving ? ' fade-out' : '')
                        + (snapshot.isDragging ? ' moving' : '');
        return (
        <div
          className={classNames}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <div className="course-button-container in-term">
            <div 
              className={`hot-zone ${hasSubsection ? "" : "disabled"}`}
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
            
            <div className="hot-zone" onClick={handleRemoveCourse}>
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
            <div className="name">{name}</div>
            <div 
              className="id-credits" 
              onClick={handleCoursePageJump}
              title="Go to course page"
            >
              {credits < 0 ? <b>{id}</b> : <><b>{id}</b> ({credits} credits)</>}
            </div>
          </div>
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
        </div>
      )}}
    </Draggable>
  );
};

export default memo(CourseCard);