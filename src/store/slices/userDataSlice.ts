import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { MemberData, Plan, Term } from "@/types/db";
import { ObjectId } from "bson";
import { I18nKey, Language, t } from "@/lib/i18n";
import { mockPlanData } from "@/lib/mock";
import { getNewTermName } from "@/lib/term";

export const initialState = {
  lang: Language.EN,
  courseTaken: new Map<string, string[]>(),

  planData: new Map<string, Plan>(),
  termData: new Map<string, Term>(),

  programs: [] as string[],

  planOrder: [] as string[],
  chatThreadIds: [] as string[],
} as MemberData;

export const userDataSlice = createSlice({
  name: "userData",
  initialState,
  reducers: {
    setLang: (state, action: PayloadAction<Language>) => {
      state.lang = action.payload;
    },
    toggleLang: (state) => {
      state.lang = state.lang === Language.EN ? Language.FR : Language.EN;
    },
    setChatThreadIds: (state, action: PayloadAction<string[]>) => {
      state.chatThreadIds = [...action.payload];
    },
    setCourseTaken: (state, action: PayloadAction<Map<string, string[]>>) => {
      state.courseTaken = new Map(action.payload);
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

    /* PROGRAM RELATED */
    setPrograms: (state, action: PayloadAction<string[]>) => {
      state.programs = [...action.payload];
    },
    addProgram: (state, action: PayloadAction<string[]>) => {
      state.programs.push(...action.payload);
    },
    removeProgram: (state, action: PayloadAction<string[]>) => {
      state.programs = state.programs.filter(
        (program) => !action.payload.includes(program),
      );
    },

    /* PLAN RElATED */
    // TODO: add validation in middleware
    setPlanData: (
      state,
      action: PayloadAction<{
        planData: Map<string, Plan>;
        planOrder: string[];
      }>,
    ) => {
      // toString is called here to handle the case where the plan id is an ObjectId
      state.planData = new Map(action.payload.planData);
      state.planOrder = action.payload.planOrder;
    },
    setPlanOrder: (state, action: PayloadAction<string[]>) => {
      state.planOrder = [...action.payload];
    },
    addPlan: (state) => {
      const newPlanName = t(
        [I18nKey.DEFAULT_PLAN_NAME],
        state.lang as Language,
      );
      const { planData, termData, planOrder } = mockPlanData(
        3,
        newPlanName,
        state.lang as Language,
      );

      termData.forEach((term) => {
        state.termData.set(term._id, term);
      });
      planData.forEach((plan) => {
        state.planData.set(plan._id, plan);
      });

      state.planOrder.unshift(...planOrder);
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
        destIdx: number;
      }>,
    ) => {
      const { planId, sourceIdx, destIdx } = action.payload;
      state.planOrder.splice(sourceIdx, 1);
      state.planOrder.splice(destIdx, 0, planId);
    },
    renamePlan: (
      state,
      action: PayloadAction<{ planId: string; newName: string }>,
    ) => {
      const { planId, newName } = action.payload;
      state.planData.get(planId)!.name = newName;
    },

    /* TERM RELATED */
    // TODO: add validation logic in middleware, only keeping native logics here
    setTermData: (state, action: PayloadAction<Map<string, Term>>) => {
      state.termData = new Map(action.payload);
    },
    addTerm: (
      state,
      action: PayloadAction<{
        planId: string;
        idx: number;
        termData?: Partial<Term>;
      }>,
    ) => {
      const { planId, idx, termData } = action.payload;

      const plan = state.planData.get(planId)!; // existence should be guaranteed by middleware

      const prevTermIdx =
        idx === -1 ? plan.termOrder.length - 1 : Math.max(0, idx - 1);
      const prevTermName =
        state.termData.get(plan.termOrder[prevTermIdx])?.name ??
        t([I18nKey.NEW_M, I18nKey.SEMESTER], state.lang as Language);

      const newTerm: Term = {
        _id: new ObjectId().toString(),
        name:
          termData?.name ??
          getNewTermName(prevTermName, idx !== 0, state.lang as Language),
        courseIds: termData?.courseIds ?? [],
      };

      state.termData.set(newTerm._id, newTerm);
      if (idx === -1) {
        plan.termOrder.push(newTerm._id);
      } else {
        plan.termOrder.splice(idx, 0, newTerm._id);
      }
    },
    deleteTerm: (
      state,
      action: PayloadAction<{
        planId: string;
        termId: string;
        termIdx: number;
      }>,
    ) => {
      const { planId, termId, termIdx } = action.payload;
      const term = state.termData.get(termId)!;
      term.courseIds.forEach((courseId) => {
        state.planData.get(planId)!.courseMetadata.delete(courseId);
      });
      const plan = state.planData.get(planId)!;
      plan.termOrder.splice(termIdx, 1);
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
    renameTerm: (
      state,
      action: PayloadAction<{ termId: string; newName: string }>,
    ) => {
      const { termId, newName } = action.payload;
      state.termData.get(termId)!.name = newName;
    },

    /* COURSE RELATED */
    addCourse: (
      state,
      action: PayloadAction<{
        courseIds: string[];
        termId: string;
        planId: string;
      }>,
    ) => {
      // TODO: is planId needed here for sync?
      const { courseIds, termId, planId } = action.payload;

      const term = state.termData.get(termId)!;
      term.courseIds.unshift(...courseIds); // duplicate check among entire plan is handled in middleware
      const plan = state.planData.get(planId)!;
      courseIds.forEach((courseId) => {
        plan.courseMetadata.set(courseId, { isOverwritten: false });
      });

      // console.group(action.type);
      // console.log(action.payload);
      // console.log("current term data", state.termData);
      // console.groupEnd();
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
      plan.courseMetadata.delete(courseId);
    },
    moveCourse: (
      state,
      action: PayloadAction<{
        planId: string;
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
    setIsOverwritten: (
      state,
      action: PayloadAction<{
        courseId: string;
        planId: string;
        isOverwritten: boolean;
      }>,
    ) => {
      const { courseId, planId, isOverwritten } = action.payload;

      const plan = state.planData.get(planId)!;
      plan.courseMetadata.get(courseId)!.isOverwritten = isOverwritten;
    },
  },
});

export const {
  setLang,
  toggleLang,
  setChatThreadIds,

  /* COURSE TAKEN RELATED */
  setCourseTaken,
  addCourseTaken,
  removeCourseTaken,

  /* PROGRAM RELATED */
  setPrograms,
  addProgram,
  removeProgram,

  /* PLAN RELATED */
  setPlanData,
  setPlanOrder,
  addPlan,
  deletePlan,
  movePlan,
  renamePlan,

  /* TERM RELATED */
  setTermData,
  addTerm,
  deleteTerm,
  moveTerm,
  renameTerm,

  /* COURSE RELATED */
  addCourse,
  deleteCourse,
  moveCourse,
  setIsOverwritten,
} = userDataSlice.actions;

export const userDataActions = userDataSlice.actions;

export const planActions = {
  setPlanData,
  setPlanOrder,
  addPlan,
  deletePlan,
  movePlan,
  renamePlan,
};

export const termActions = {
  setTermData,
  addTerm,
  deleteTerm,
  moveTerm,
  renameTerm,
};

export const courseActions = {
  addCourse,
  deleteCourse,
  moveCourse,
  setIsOverwritten,
};

export const courseTakenActions = {
  setCourseTaken,
  addCourseTaken,
  removeCourseTaken,
};

export const programActions = {
  setPrograms,
  addProgram,
  removeProgram,
};

export type ProgramAction = ReturnType<
  (typeof programActions)[keyof typeof programActions]
>;
export type PlanAction = ReturnType<
  (typeof planActions)[keyof typeof planActions]
>;
export type TermAction = ReturnType<
  (typeof termActions)[keyof typeof termActions]
>;
export type CourseAction = ReturnType<
  (typeof courseActions)[keyof typeof courseActions]
>;
export type CourseTakenAction = ReturnType<
  (typeof courseTakenActions)[keyof typeof courseTakenActions]
>;

export default userDataSlice.reducer;
