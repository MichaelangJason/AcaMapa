
import { TermId } from "@/types/term";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { memo, useCallback, useState } from "react";
import { DraggingType, ModalType } from "@/utils/enums";
import { setAddingCourseId, setSeekingInfo } from "@/store/slices/globalSlice";
import { toast } from "react-toastify";
import { CourseCard } from "@/components/Course";
import { getCourse } from "@/utils/requests";
import { addCourseToTerm, deleteTerm, setTermName } from "@/store/slices/termSlice";
import { addCourse, setCourseMounted } from "@/store/slices/courseSlice";
import "@/styles/terms.scss"
import "@/styles/dropdown.scss"
import Image from "next/image";
import { ICourse } from "@/db/schema";
import * as DM from "@radix-ui/react-dropdown-menu";
import RenameConfirmModal, { RenameConfirmModalInfo } from "@/components/Layout/RenameConfirmModal";
export interface TermCardProps {
  termId: TermId;
  index: number;
}

const TermCard = (props: TermCardProps) => {
  const { termId, index } = props;
  const termData = useSelector((state: RootState) => state.terms.data[termId]);
  const courseIds = termData.courseIds || [];
  const termName = termData.name || `Term ${index + 1}`;
  const { seekingId, seekingTerm } = useSelector((state: RootState) => state.global.seekingInfo);
  const isSeeking = seekingId !== undefined && seekingTerm !== undefined;
  const isSeekingSelf = isSeeking && seekingTerm === termId;
  const credits = useSelector((state: RootState) => 
    courseIds.reduce((acc, courseId) => {
      if (!(courseId in state.courses)) {
        return acc;
      }
      const credits = state.courses[courseId].credits;
      return acc + (credits < 0 ? 0 : credits);
    }, 0)
  )

  const dispatch = useDispatch();
  const addingCourseId = useSelector((state: RootState) => state.global.addingCourseId);
  const isAddingCourse = addingCourseId !== null;
  const inTermCourseIds = useSelector((state: RootState) => state.terms.inTermCourseIds);
  const existingAddingCourse = useSelector((state: RootState) => addingCourseId ? state.courses[addingCourseId] : null)
  const [modalInfo, setModalInfo] = useState<RenameConfirmModalInfo | undefined>(undefined);

  const handleAddCourse = useCallback(async () => {
    // check if course exists in any term
    const formattedCourseId = addingCourseId!.slice(0, 4).toUpperCase() + " " + addingCourseId!.slice(4).toUpperCase();
    if (inTermCourseIds.includes(addingCourseId!)) {
      toast.error(`Cannot add duplicate ${formattedCourseId}`);
      dispatch(setAddingCourseId(null));
      return;
    }
    
    dispatch(setAddingCourseId(null));

    // for animation purposes, delay adding course
    setTimeout(async () => {
      let course: ICourse | null = existingAddingCourse;

      if (!course) {
        course = await toast.promise(
          getCourse(addingCourseId!),
          {
            pending: `Fetching ${formattedCourseId}...`,
            error: `Failed to fetch ${formattedCourseId}`,
            success: `${formattedCourseId} fetched successfully`,
          }
        );
      }
      
      if (!course) {
        toast.error(`Course not found: ${formattedCourseId}`);
      } else {
          const id = course.id;
          dispatch(addCourse(course))
          dispatch(addCourseToTerm({ termId, courseId: id }))

          setTimeout(() => { // set mounted after animation
            dispatch(setCourseMounted({ courseId: id, isMounted: true }))
          }, 200);
        }
      }, 100);

  }, [termId, addingCourseId, dispatch, inTermCourseIds, existingAddingCourse]);

  const handleDeleteTerm = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (isSeekingSelf) dispatch(setSeekingInfo({})); // clear seeking info
    setModalInfo({
      type: ModalType.DELETE,
      confirmCb: () => {
        dispatch(deleteTerm(termId));
      },
      closeCb: () => {
        setModalInfo(undefined);
      },
      text: termName
    })
  }

  const handleRenameTerm = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();

    if (isSeekingSelf) dispatch(setSeekingInfo({})); // clear seeking info

    setModalInfo({
      type: ModalType.RENAME,
      confirmCb: (newName: string) => {
        dispatch(setTermName({ termId, name: newName }));
      },
      closeCb: () => {
        setModalInfo(undefined);
      },
      text: termName
    })
  }

  const getMaskTop = () => {
    if (typeof document === "undefined") return 0;
    const termBody = document.getElementById(termId)?.querySelector(".term-body");
    if (!termBody) return 0;
    return termBody.scrollTop;
  }

  return (
    <>
      <Draggable draggableId={termId} index={index} isDragDisabled={isSeeking}>
        {(provided, snapshot) =>
          <div
            className="term"
            ref={provided.innerRef}
            {...provided.draggableProps}
            id={termId}
          >
            {/* term header */}
            <div 
              className={`term-header ${snapshot.isDragging ? "dragging" : ""} ${isSeeking ? "seeking" : ""}`} 
              {...provided.dragHandleProps}
            >
              <div className="term-name">{termName}</div>
              <DM.Root modal={false}>
                <DM.Trigger className="delete-icon" asChild>
                  <Image src="hamburger.svg" alt="delete" width={20} height={20} />
                </DM.Trigger>
                
                <DM.Portal>
                  <DM.Content className="dropdown-menu-content" sideOffset={4}>
                    <DM.Item className="dropdown-menu-item" onClick={handleDeleteTerm}>
                      <span className="name">Delete</span>
                    </DM.Item>
                    <DM.Item className="dropdown-menu-item" onClick={handleRenameTerm}>
                      <span className="name">Rename</span>
                    </DM.Item>
                  </DM.Content>
                </DM.Portal>
              </DM.Root>
 
            </div>
            {/* droppable for courses */}
            <Droppable droppableId={termId} type={DraggingType.COURSE}>
              {(provided, snapshot) => (
                <div
                  className={"term-body" + (snapshot.isDraggingOver ? " dragging-over" : "") + (isAddingCourse || isSeeking ? " overflow-hidden" : "")}
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {/* add course mask */}
                  <div 
                    className={`add-course-mask ${isAddingCourse ? "visible" : ""}`}
                    style={{ top: getMaskTop() }}
                    onClick={handleAddCourse}
                  >
                    Click to Add Course
                  </div>
                  {/* courses */}
                  {courseIds.map((courseId, index) => (
                    <CourseCard key={courseId} termId={termId} courseId={courseId} index={index} />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
            {/* term footer */}
            <div className="term-footer">
              <div>{credits} credits</div>
            </div>
          </div>
        }
      </Draggable>
      {modalInfo && <RenameConfirmModal modalInfo={modalInfo} />}
    </>
  )
}

export default memo(TermCard);