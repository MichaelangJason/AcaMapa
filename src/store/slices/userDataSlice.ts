import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { CourseMetadata, Plan, Term } from "@/types/db";
import { ObjectId } from "bson";

const initialState = {
  courseTaken: new Map<string, string[]>(),

  planData: new Map<string, Plan>(),
  termData: new Map<string, Term>(),

  planOrder: [] as string[],
};

export const userDataSlice = createSlice({
  name: "userData",
  initialState,
  reducers: {
    setCourseTaken: (
      state,
      action: PayloadAction<{ [subjectCode: string]: string[] }>,
    ) => {
      state.courseTaken = new Map(Object.entries(action.payload));
    },
    addCourseTaken: (state, action: PayloadAction<string[]>) => {
      action.payload.forEach((id) => {
        const subjectCode = id.slice(0, 4);
        if (!state.courseTaken.has(subjectCode)) {
          state.courseTaken.set(subjectCode, []);
        }
        state.courseTaken.get(subjectCode)?.push(id);
      });
    },
    removeCourseTaken: (state, action: PayloadAction<string[]>) => {
      action.payload.forEach((id) => {
        const subjectCode = id.slice(0, 4);
        state.courseTaken.set(
          subjectCode,
          state.courseTaken
            .get(subjectCode)
            ?.filter((courseId) => courseId !== id) ?? [],
        );

        if (state.courseTaken.get(subjectCode)?.length === 0) {
          state.courseTaken.delete(subjectCode);
        }
      });
    },

    /* PLAN RElATED */
    // TODO: add validation in middleware
    setPlanData: (
      state,
      action: PayloadAction<{
        planData: { [planId: string]: Plan };
        planOrder: string[];
      }>,
    ) => {
      // toString is called here to handle the case where the plan id is an ObjectId
      state.planData = new Map(Object.entries(action.payload.planData));
      state.planOrder = action.payload.planOrder;

      // initialize course metadata for each plan
      state.planData.forEach((plan) => {
        // existence of term is guaranteed by middleware
        const courseIds = plan.termOrder.flatMap(
          (termId) => state.termData.get(termId)!.courseIds,
        );
        plan.courseMetadata = {
          ...courseIds.reduce(
            (acc, courseId) => {
              acc[courseId] = { isOverwritten: false };
              return acc;
            },
            {} as { [courseId: string]: CourseMetadata },
          ),
          ...plan.courseMetadata,
        };
      });
    },
    setPlanOrder: (state, action: PayloadAction<string[]>) => {
      state.planOrder = action.payload;
    },
    addPlan: (state, action: PayloadAction<Partial<Plan>>) => {
      const newId = new ObjectId().toString();
      state.planData.set(newId, {
        name: action.payload.name ?? "New Plan",
        termOrder: action.payload.termOrder ?? [],
        courseMetadata: action.payload.courseMetadata ?? {},
        _id: newId,
      });
    },
    deletePlan: (state, action: PayloadAction<string>) => {
      const plan = state.planData.get(action.payload)!;
      plan.termOrder.forEach((termId) => state.termData.delete(termId));
      state.planData.delete(action.payload);
      state.planOrder = state.planOrder.filter((id) => id !== action.payload);
    },
    movePlan: (
      state,
      action: PayloadAction<{
        planId: string;
        sourceIdx: number;
        destinationIdx: number;
      }>,
    ) => {
      const { planId, sourceIdx, destinationIdx } = action.payload;
      state.planOrder.splice(sourceIdx, 1);
      state.planOrder.splice(destinationIdx, 0, planId);
    },

    /* TERM RELATED */
    // TODO: add validation logic in middleware, only keeping native logics here
    setTermData: (
      state,
      action: PayloadAction<{ termData: { [termId: string]: Term } }>,
    ) => {
      state.termData = new Map(Object.entries(action.payload.termData));
    },
    addTerm: (
      state,
      action: PayloadAction<{
        planId: string;
        idx: number;
        termData: Partial<Term>;
      }>,
    ) => {
      const { planId, idx, termData } = action.payload;

      const plan = state.planData.get(planId)!; // existence should be guaranteed by middleware
      const newTerm: Term = {
        _id: new ObjectId().toString(),
        name: termData.name ?? "New Term",
        courseIds: termData.courseIds ?? [],
      };

      state.termData.set(newTerm._id, newTerm);
      plan.termOrder.splice(idx, 0, newTerm._id);
    },
    deleteTerm: (
      state,
      action: PayloadAction<{ planId: string; termId: string }>,
    ) => {
      const { planId, termId } = action.payload;
      state.planData.delete(planId);
      state.termData.delete(termId);
    },
    moveTerm: (
      state,
      action: PayloadAction<{
        termId: string;
        planId: string;
        sourceIdx: number;
        destIdx: number;
      }>,
    ) => {
      const { termId, planId, sourceIdx, destIdx } = action.payload;
      const plan = state.planData.get(planId)!; // explicitly get plan object, existence should be guarenteed by middleware

      plan.termOrder.splice(sourceIdx, 1);
      plan.termOrder.splice(destIdx, 0, termId);
    },

    /* COURSE RELATED */
    addCourse: (
      state,
      action: PayloadAction<{
        courseId: string;
        termId: string;
        planId: string;
      }>,
    ) => {
      // TODO: is planId needed here for sync?
      const { courseId, termId, planId } = action.payload;

      const term = state.termData.get(termId)!;
      term.courseIds.unshift(courseId); // duplicate check among entire plan is handled in middleware
      const plan = state.planData.get(planId)!;
      plan.courseMetadata[courseId] = { isOverwritten: false };
    },
    deleteCourse: (
      state,
      action: PayloadAction<{
        courseId: string;
        termId: string;
        planId: string;
      }>,
    ) => {
      const { courseId, termId, planId } = action.payload;

      const term = state.termData.get(termId)!;
      term.courseIds = term.courseIds.filter((id) => id !== courseId);
      const plan = state.planData.get(planId)!;
      delete plan.courseMetadata[courseId];
    },
    moveCourse: (
      state,
      action: PayloadAction<{
        courseId: string;
        sourceTermId: string;
        destTermId: string;
        sourceIdx: number;
        destIdx: number;
      }>,
    ) => {
      const { courseId, sourceTermId, sourceIdx, destTermId, destIdx } =
        action.payload;

      const sourceTerm = state.termData.get(sourceTermId)!;
      const destTerm = state.termData.get(destTermId)!;

      sourceTerm.courseIds.splice(sourceIdx, 1);
      destTerm.courseIds.splice(destIdx, 0, courseId);
    },
    setCourseIsOverwritten: (
      state,
      action: PayloadAction<{
        courseId: string;
        planId: string;
        isOverwritten: boolean;
      }>,
    ) => {
      const { courseId, planId, isOverwritten } = action.payload;

      const plan = state.planData.get(planId)!;
      plan.courseMetadata[courseId].isOverwritten = isOverwritten;
    },
  },
});

export const {
  setCourseTaken,
  addCourseTaken,
  removeCourseTaken,

  /* PLAN RELATED */
  setPlanData,
  setPlanOrder,
  addPlan,
  deletePlan,
  movePlan,

  /* TERM RELATED */
  setTermData,
  addTerm,
  deleteTerm,
  moveTerm,

  /* COURSE RELATED */
  addCourse,
  deleteCourse,
  moveCourse,
  setCourseIsOverwritten,
} = userDataSlice.actions;

export type PlanAction = ReturnType<
  | typeof setPlanData
  | typeof setPlanOrder
  | typeof addPlan
  | typeof deletePlan
  | typeof movePlan
>;
export type TermAction = ReturnType<
  typeof setTermData | typeof addTerm | typeof deleteTerm | typeof moveTerm
>;
export type CourseAction = ReturnType<
  | typeof addCourse
  | typeof deleteCourse
  | typeof moveCourse
  | typeof setCourseIsOverwritten
>;
export type CourseTakenAction = ReturnType<
  typeof setCourseTaken | typeof addCourseTaken | typeof removeCourseTaken
>;

export default userDataSlice.reducer;
