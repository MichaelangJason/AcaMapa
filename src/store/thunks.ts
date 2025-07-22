import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState, AppDispatch } from ".";
import { isValidDetailedCourse } from "@/lib/typeGuards";
import {
  setIsCourseExpanded,
  setCurrentPlanId,
  updateCachedDetailedCourseData,
  initPlanIsCourseExpanded,
  setSeekingCourseId,
  setSearchResult,
} from "./slices/localDataSlice";
import {
  addCourse,
  setIsOverwritten,
  setPlanData,
  setTermData,
} from "./slices/userDataSlice";
import { setIsInitialized } from "./slices/globalSlice";
import { mockNewPlan } from "@/lib/mock";
import type { Term } from "@/types/db";
import type { CachedDetailedCourse } from "@/types/local";
import { parseGroup } from "@/lib/course";
import { ResultType } from "@/lib/enums";
import { formatCourseId } from "@/lib/utils";

const createAppAsyncThunk = createAsyncThunk.withTypes<{
  state: RootState;
  dispatch: AppDispatch;
}>();

export const fetchCourseData = createAppAsyncThunk(
  "thunks/fetchCourseData",
  async (
    courseIds: string[],
    { dispatch, rejectWithValue, fulfillWithValue },
  ) => {
    const response = await fetch(`/api/courses?ids=${courseIds.join(",")}`, {
      method: "GET",
    });

    if (response.ok) {
      const data = await response.json();
      if (
        !(Array.isArray(data) && data.every((v) => isValidDetailedCourse(v)))
      ) {
        return rejectWithValue("Invalid Course Data");
      }

      const inputIds = new Set(courseIds);
      if (data.length !== courseIds.length) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const errorIds = data
          .map((c) => c.id)
          .reduce((acc, val) => {
            if (!inputIds.has(val)) acc.push(val); // can create new array instead
            return acc;
          }, [] as string[]);
        // TODO: toast for errorId
      }

      (data as CachedDetailedCourse[]).forEach((c) => {
        c.prerequisites.group = parseGroup(c.prerequisites.parsed);
        c.corequisites.group = parseGroup(c.corequisites.parsed);
        c.restrictions.group = parseGroup(c.restrictions.parsed);

        console.log(c.prerequisites.group);
        console.log(c.corequisites.group);
        console.log(c.restrictions.group);
      });

      dispatch(updateCachedDetailedCourseData(data as CachedDetailedCourse[]));
      return fulfillWithValue(data);
      // TODO: toast for success
    }
    // TODO: toast error
    return rejectWithValue("Failed to fetch course data");
  },
);

export const addCourseToTerm = createAppAsyncThunk(
  "thunks/addCourseToTerm",
  async (
    {
      courseIds,
      termId,
      planId,
    }: { courseIds: string[]; termId: string; planId: string },
    { getState, dispatch, rejectWithValue, fulfillWithValue },
  ) => {
    const state = getState();

    const unCachedCourseIds = courseIds.filter(
      (id) => !state.localData.cachedDetailedCourseData[id],
    );
    if (unCachedCourseIds.length > 0) {
      await dispatch(fetchCourseData(unCachedCourseIds)).unwrap(); // cache courses before adding to plan
    }

    const plan = state.userData.planData.get(planId);
    if (!plan) {
      return rejectWithValue("Plan not found");
    }
    const term = plan.termOrder.find((t) => t === termId);
    if (!term) {
      return rejectWithValue(`Term not found in plan: ${plan.name}`);
    }

    const termData = state.userData.termData.get(termId);
    if (!termData) {
      return rejectWithValue("Term data not found");
    }

    const duplicateCourseIds: string[] = [];
    const newCourseIds: string[] = [];

    courseIds.forEach((id) => {
      if (plan.courseMetadata[id] !== undefined) {
        duplicateCourseIds.push(id);
      } else {
        newCourseIds.push(id);
      }
    });

    if (duplicateCourseIds.length > 0) {
      // TODO: toast for duplicate course ids
    }

    dispatch(
      addCourse({
        courseIds: newCourseIds,
        termId,
        planId,
      }),
    );

    return fulfillWithValue(courseIds);
  },
);

export const initApp = createAppAsyncThunk(
  "thunks/initApp",
  async (_, { dispatch, fulfillWithValue }) => {
    const { plan, terms } = mockNewPlan(3, "Mock Plan");

    const termData = terms.reduce(
      (acc, term) => {
        acc[term._id] = term;
        return acc;
      },
      {} as { [termId: string]: Term },
    );

    const planData = {
      [plan._id]: plan,
    };

    const planOrder = [plan._id];

    dispatch(setTermData({ termData }));
    dispatch(setPlanData({ planData, planOrder }));
    dispatch(setCurrentPlanId(plan._id));
    dispatch(initPlanIsCourseExpanded(plan._id));

    dispatch(
      setIsCourseExpanded({
        planId: plan._id,
        courseIds: Object.keys(plan.courseMetadata),
        isExpanded: true,
      }),
    );

    dispatch(setIsInitialized(true));
    return fulfillWithValue(true);
  },
);

export const seekCourse = createAppAsyncThunk(
  "thunks/seekCourse",
  async (courseId: string, { dispatch, getState }) => {
    dispatch(setSeekingCourseId(courseId));
    const state = getState();

    if (!state.localData.cachedDetailedCourseData[courseId]) {
      await dispatch(fetchCourseData([courseId])).unwrap();
    }

    const cachedCourse = state.localData.cachedDetailedCourseData[courseId];
    const subseqCourses = cachedCourse.futureCourses.map(
      (c) => state.localData.courseData[c],
    );

    if (subseqCourses.length !== cachedCourse.futureCourses.length) {
      throw new Error("Seeking course missing future courses");
    }

    dispatch(
      setSearchResult({
        type: ResultType.SEEKING,
        query: formatCourseId(courseId),
        data: subseqCourses,
      }),
    );

    // TODO
  },
);

export const overwriteCourse = createAppAsyncThunk(
  "thunks/overwriteCourse",
  async (
    { courseId, isOverwritten }: { courseId: string; isOverwritten: boolean },
    { dispatch, getState },
  ) => {
    // TODO: pop a modal to inform user that they are overwriting a course which also requires a confirmation
    const planId = getState().localData.currentPlanId;
    dispatch(setIsOverwritten({ courseId, planId, isOverwritten }));
  },
);
