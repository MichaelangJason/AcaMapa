'use client'

import { AppStore, makeStore } from "@/store"
import { Provider } from "react-redux"
import { KeyPressListener, ToolTips } from "@/components/Common";
import { Assistant, SideBar, UtilityBar } from "@/components/Layout";
import { Terms } from "@/components/Term";
import { setDroppableId, setInitCourses, setIsInitialized, setDraggingType, setIsDragging } from "@/store/slices/globalSlice";
import { deleteTerm, moveCourse, moveTerm, setTermsData } from "@/store/slices/termSlice";
import { DraggingType, LocalStorage } from "@/utils/enums";
import { DragDropContext, DragStart, DragUpdate, DropResult } from "@hello-pangea/dnd";
import { useDispatch } from "react-redux";
import { Flip, toast, ToastContainer } from "react-toastify";
import { useEffect, useRef } from "react";
import { ICourse } from "@/db/schema";
import { isValidAssistantState, isValidPlanState, isValidTermData } from "@/utils/typeGuards";
import { movePlan, setPlans } from "@/store/slices/planSlice";
import { Course } from "@/types/course";
import { setCoursesData } from "@/store/slices/courseSlice";
import { setCurrentThreadId, setMessages, setThreadIds } from "@/store/slices/assistantSlice";


const App = () => {
  const dispatch = useDispatch();

  const handleDragStart = (start: DragStart) => {
    dispatch(setDraggingType(start.type as DraggingType));
    dispatch(setDroppableId(start.source.droppableId));
    dispatch(setIsDragging(true));
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
    dispatch(setIsDragging(false));
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
      dispatch(moveTerm({ 
        sourceIdx: source.index, 
        destinationIdx: destination.index 
      }));
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
    if (type === DraggingType.PLAN) {
      dispatch(movePlan({
        sourceIdx: source.index,
        destinationIdx: destination.index,
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
        <UtilityBar />
        <Assistant />
        <SideBar />
        <Terms />
        <KeyPressListener />
        <ToastContainer
          position="bottom-center"
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
    </>
  );
}

const Wrapper = (props: { initCourses: ICourse[] }) => {
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
      
      const savedPlans = localStorage.getItem(LocalStorage.PLANS);
      const savedTerms = localStorage.getItem(LocalStorage.TERMS);
      const savedThreadIds = localStorage.getItem(LocalStorage.ASSISTANT);

      // XORS to check if both are present
      if (!!savedPlans !== !!savedTerms) {
        // clear local storage?
        // localStorage.removeItem(LocalStorage.PLANS);
        // localStorage.removeItem(LocalStorage.TERMS);
        toast.error("Failed Loading Previous Session")
      }

      if (savedPlans && savedTerms) {
        const plans = JSON.parse(savedPlans);
        const terms = JSON.parse(savedTerms);

        await toast.promise(
          async () => {
            if (!isValidPlanState(plans) || !isValidTermData(terms)) {
              throw new Error("Invalid plan or term state");
            }
            const courseIds = new Set(Object.values(terms).flatMap(term => term.courseIds));
            const courses = await fetch('/api/courses', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ courseIds: Array.from(courseIds) })
            })

            if (!courses.ok) {
              console.error(courses);
              console.error(courses.status);
              throw new Error("Failed to fetch courses");
            }

            const coursesData = await courses.json() as Course[];

            if (coursesData?.length !== courseIds.size) {
              throw new Error("Failed to fetch courses");

            }

            dispatch(setCoursesData(coursesData));
            dispatch(setTermsData(terms));
            dispatch(setPlans(plans));
          },
          {
            pending: 'Loading last state...',
            error: 'Failed to load last state',
            success: 'Last state restored!',
          }
        )
        
      }

      if (savedThreadIds) {
        const threadIds = JSON.parse(savedThreadIds);
        
        if (!isValidAssistantState(threadIds)) {
          throw new Error("Invalid assistant state");
        }

        dispatch(setThreadIds(threadIds.threadIds));
        dispatch(setCurrentThreadId(threadIds.currentThreadId));

        if (threadIds.currentThreadId !== null) {
          await toast.promise(
            async () => {
              const response = await fetch(`/api/chat/${threadIds.currentThreadId}`);
              if (!response.ok) {
                throw new Error("Failed to fetch chat history");
              }
              const data = await response.json();
              dispatch(setMessages(data.messages));
            },
            {
              pending: 'Loading chat history...',
              error: 'Failed to load chat history',
              success: 'Chat history loaded!',
            }
          )
        }
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