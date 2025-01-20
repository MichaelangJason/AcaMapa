'use client'

import { AppStore, makeStore } from "@/store"
import { Provider } from "react-redux"
import { KeyPressListener, ToolTips } from "@/components/Common";
import { SideBar } from "@/components/Layout";
import { Terms } from "@/components/Term";
import { setDroppableId, setInitCourses, setIsInitialized } from "@/store/slices/globalSlice";
import { setDraggingType } from "@/store/slices/globalSlice";
import { deleteTerm, importTerms, moveCourse, moveTerm } from "@/store/slices/termSlice";
import { DraggingType, LocalStorage } from "@/utils/enums";
import { DragDropContext, DragStart, DragUpdate, DropResult } from "@hello-pangea/dnd";
import { useDispatch } from "react-redux";
import { Flip, toast, ToastContainer } from "react-toastify";
import { TutorialModal, AboutModal } from "@/components/Modal";
import { useEffect, useRef } from "react";
import { Course } from "@/types/course";
import { isValidCourseTaken, isValidTermsState } from "@/utils/typeGuards";
import { addCourses, setCourseMounted } from "@/store/slices/courseSlice";
import { IRawCourse } from "@/db/schema";
import { importCourseTaken } from "@/store/slices/courseTakenSlice";

const App = () => {
  const dispatch = useDispatch();

  const handleDragStart = (start: DragStart) => {
    dispatch(setDraggingType(start.type as DraggingType));
    dispatch(setDroppableId(start.source.droppableId));
  }

  const handleDragUpdate = (update: DragUpdate) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { destination, source, draggableId, type } = update;
    if (!destination) {
      dispatch(setDraggingType(null));
      dispatch(setDroppableId(null));
    }
    else {
      dispatch(setDraggingType(type as DraggingType));
      dispatch(setDroppableId(destination.droppableId));
    }
  }

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId, type } = result;
    dispatch(setDraggingType(null));
    dispatch(setDroppableId(null));
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) return;
    if (destination.droppableId === "delete-term") {
      // delete the dom with the draggableId in data-rfd-draggable-id
      dispatch(deleteTerm(draggableId));
      return;
    }
    if (type === DraggingType.TERM) {
      dispatch(moveTerm({ sourceIdx: source.index, destinationIdx: destination.index }));
    }
    if (type === DraggingType.COURSE) {
      dispatch(moveCourse({
        courseId: draggableId,
        sourceIdx: source.index, 
        destinationIdx: destination.index, 
        sourceTermId: source.droppableId, 
        destinationTermId: destination.droppableId 
      }));
    }
  }
  
  return (
    <>
      <DragDropContext 
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEnd}
        onDragUpdate={handleDragUpdate}
      >
        <SideBar />
        <Terms />
        <KeyPressListener />
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={true}
          newestOnTop={false}
          closeOnClick={false}
          pauseOnHover={false}
          rtl={false}
          draggable
          theme="light"
          transition={Flip}
          stacked
        />
      </DragDropContext>
      <KeyPressListener />
      <ToolTips />
      <TutorialModal />
      <AboutModal />
    </>
  );
}

const Wrapper = (props: { initCourses: IRawCourse[] }) => {
  const storeRef = useRef<AppStore>(null);

  // only run once
  if (!storeRef.current) {
    storeRef.current = makeStore()
  }

  const isInitialized = storeRef.current.getState().global.isInitialized;
  const dispatch = storeRef.current.dispatch;

  useEffect(() => {
    const initializeData = async () => {
      if (isInitialized) return;

      dispatch(setInitCourses(props.initCourses));
      
      const savedPlans = localStorage.getItem(LocalStorage.TERMS);
      const savedCourseTaken = localStorage.getItem(LocalStorage.COURSE_TAKEN);

      // load back terms
      if (savedPlans || savedCourseTaken) {
        await toast.promise(
          async () => {
            if (savedPlans) {
              const plans = JSON.parse(savedPlans);  
              if (isValidTermsState(plans) && plans.inTermCourseIds.length > 0) {
                const response = await fetch('/api/courses', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ courseIds: plans.inTermCourseIds })
                })
  
                if (!response.ok) throw new Error('fetching course failed')
                const coursesData = await response.json() as Course[]
  
                if (!coursesData?.length) {
                  toast.error("Failed Loading Previous Session")
                  return;
                }
              
                dispatch(addCourses(coursesData));
                dispatch(importTerms(plans));

                setTimeout(() => {
                  coursesData.forEach(course => {
                    dispatch(setCourseMounted({ courseId: course.id, isMounted: true}))
                  })
                }, 300)
              }

              if (savedCourseTaken) {
                const courseTaken = JSON.parse(savedCourseTaken);
                if (isValidCourseTaken(courseTaken) && Object.values(courseTaken).flat().length > 0) {
                  dispatch(importCourseTaken(courseTaken));
                }
              }
            }

          }, {
            pending: 'Loading last state...',
            error: 'Failed to load last state',
            success: 'Last state restored!',
          }
        )
      }

      toast.success("Initialized!")
      document.body.style.overflow = 'scroll'
      dispatch(setIsInitialized(true));
    };
    initializeData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Provider store={storeRef.current}>
      <App/>
    </Provider>
  )
}

export default Wrapper;