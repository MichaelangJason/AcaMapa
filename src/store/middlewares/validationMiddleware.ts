/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { RootState } from "..";
import type {
  Middleware,
  ThunkDispatch,
  UnknownAction,
} from "@reduxjs/toolkit";
import {
  isPlanAction,
  isTermAction,
  isCourseAction,
  isCourseTakenAction,
  isLocalDataAction,
  isValidObjectId,
} from "@/lib/typeGuards";
import {
  MAX_PLAN,
  MAX_TERM_PER_PLAN,
  MAX_COURSE_PER_TERM,
} from "@/lib/constants";
import { getSubjectCode } from "@/lib/course";

const validationMiddleware: Middleware<
  {},
  RootState,
  ThunkDispatch<RootState, undefined, UnknownAction>
> = (store) => (next) => (action) => {
  const state = store.getState();

  if (isPlanAction(action)) {
    switch (action.type) {
      case "userData/renamePlan": {
        const { planId, newName } = action.payload;
        if (!isValidObjectId(planId)) {
          throw new Error(`Invalid plan id: ${planId}`);
        }
        if (typeof newName !== "string" || newName.length === 0) {
          throw new Error(`Invalid new name: ${newName}`);
        }

        break;
      }
      case "userData/movePlan": {
        const { planId, sourceIdx, destIdx: destinationIdx } = action.payload;
        if (!isValidObjectId(planId)) {
          throw new Error(`Invalid plan id: ${planId}`);
        }
        if (sourceIdx < 0 || destinationIdx < 0) {
          throw new Error(`Invalid index: ${sourceIdx} or ${destinationIdx}`);
        }

        break;
      }
      case "userData/deletePlan": {
        const planId = action.payload;
        if (!isValidObjectId(planId)) {
          throw new Error(`Invalid plan id: ${planId}`);
        }

        break;
      }
      case "userData/addPlan": {
        const numPlan = state.userData.planData.size;
        if (numPlan >= MAX_PLAN) {
          throw new Error(`Max plan reached: ${numPlan}`);
        }
        const { name, termOrder, courseMetadata } = action.payload;
        if (name !== undefined && typeof name !== "string") {
          throw new Error(`Invalid name: ${name}`);
        }
        if (
          termOrder !== undefined &&
          (typeof termOrder !== "object" || termOrder === null)
        ) {
          throw new Error(`Invalid term order: ${termOrder}`);
        }
        if (
          courseMetadata !== undefined &&
          (typeof courseMetadata !== "object" || courseMetadata === null)
        ) {
          throw new Error(`Invalid course metadata: ${courseMetadata}`);
        }

        break;
      }
      case "userData/setPlanOrder": {
        const planOrder = action.payload;
        const invalidIds = planOrder.filter(
          (id: string) => !isValidObjectId(id),
        );
        if (invalidIds.length > 0) {
          throw new Error(`Invalid plan ids: ${invalidIds.join(", ")}`);
        }

        break;
      }
      case "userData/setPlanData": {
        const { planData, planOrder } = action.payload;

        const planIds = new Set(planData.keys()); // no duplicate plan ids guaranteed by dictionary
        if (planIds.size !== planOrder.length) {
          throw new Error(
            `Plan ids and plan order length mismatch: ${planIds.size} !== ${planOrder.length}`,
          );
        }

        // check plans
        const planErrors = planOrder.reduce(
          (acc: { [planId: string]: string[] }, planId: string) => {
            const errors: string[] = [];
            if (!isValidObjectId(planId)) {
              errors.push(`Invalid plan id in plan order: ${planId}`);
            }
            if (!planIds.has(planId)) {
              errors.push(`Plan id not found in plan data: ${planId}`);
            }
            // check plan data
            const plan = planData.get(planId);
            if (!plan) {
              errors.push(`Plan id not found in plan data: ${planId}`);
            }
            if (typeof plan !== "object" || plan === null) {
              errors.push(`Invalid plan data: ${plan}`);
            }
            if (typeof plan?.name !== "string" || plan?.name.length === 0) {
              errors.push(`Invalid plan name: ${plan?.name}`);
            }
            if (
              typeof plan?.termOrder !== "object" ||
              plan?.termOrder === null
            ) {
              errors.push(`Invalid term order: ${plan?.termOrder}`);
            }
            // TODO: better validation for course metadata
            if (
              typeof plan?.courseMetadata !== "object" ||
              plan?.courseMetadata === null
            ) {
              errors.push(`Invalid course metadata: ${plan?.courseMetadata}`);
            }

            const courseIds = plan?.termOrder?.flatMap(
              (termId) => state.userData.termData.get(termId)?.courseIds ?? [],
            );
            if (courseIds?.length !== plan?.courseMetadata?.size) {
              errors.push(
                `Course metadata size mismatch: ${courseIds?.length} !== ${plan?.courseMetadata?.size}`,
              );
            }
            if (courseIds?.some((id) => !plan?.courseMetadata?.has(id))) {
              errors.push(
                `Course metadata size mismatch: ${courseIds?.length} !== ${plan?.courseMetadata?.size}`,
              );
            }

            plan?.termOrder?.forEach((termId: string) => {
              if (!isValidObjectId(termId)) {
                errors.push(`Invalid term id in plan: ${termId}`);
              }
              if (!state.userData.termData.has(termId)) {
                errors.push(`Term id not found in term data: ${termId}`);
              }
            });
            const termSet = new Set(plan?.termOrder);
            if (termSet?.size !== plan?.termOrder?.length) {
              errors.push(`Duplicate term IDs found in plan: ${planId}`);
            }

            if (errors.length > 0) {
              acc[planId] = errors;
            }

            return acc;
          },
          {} as { [planId: string]: string[] },
        );

        if (Object.keys(planErrors).length > 0) {
          throw new Error(
            `Invalid plan data: ${JSON.stringify(planErrors, null, 2)}`,
          );
        }

        break;
      }
      default:
        throw new Error(`Invalid plan action: ${action}`);
    }
  }

  if (isTermAction(action)) {
    switch (action.type) {
      case "userData/renameTerm": {
        const { termId, newName } = action.payload;
        if (!isValidObjectId(termId)) {
          throw new Error(`Invalid term id: ${termId}`);
        }
        if (typeof newName !== "string" || newName.length === 0) {
          throw new Error(`Invalid new name: ${newName}`);
        }
        break;
      }
      case "userData/setTermData": {
        const termData = action.payload;
        const invalidTermIds = Object.keys(termData).filter(
          (id: string) => !isValidObjectId(id),
        ); // no duplicate term ids guaranteed by dictionary
        if (invalidTermIds.length > 0) {
          throw new Error(`Invalid term ids: ${invalidTermIds.join(", ")}`);
        }

        break;
      }
      case "userData/addTerm": {
        const numTerm = state.userData.termData.size;
        if (numTerm >= MAX_TERM_PER_PLAN) {
          throw new Error(`Max term per plan reached: ${numTerm}`);
        }
        const { planId, idx, termData } = action.payload;
        if (!isValidObjectId(planId)) {
          throw new Error(`Invalid plan id: ${planId}`);
        }
        if (
          idx < -1 ||
          idx > state.userData.planData.get(planId)!.termOrder.length
        ) {
          throw new Error(`Invalid index: ${idx}`);
        }
        if ((termData && typeof termData !== "object") || termData === null) {
          throw new Error(`Invalid term data: ${termData}`);
        }

        break;
      }
      case "userData/deleteTerm": {
        const { planId, termId } = action.payload;
        if (!isValidObjectId(planId)) {
          throw new Error(`Invalid plan id: ${planId}`);
        }
        if (!isValidObjectId(termId)) {
          throw new Error(`Invalid term id: ${termId}`);
        }

        break;
      }
      case "userData/moveTerm": {
        const { termId, planId, sourceIdx, destIdx } = action.payload;
        if (!isValidObjectId(termId)) {
          throw new Error(`Invalid term id: ${termId}`);
        }
        if (!isValidObjectId(planId)) {
          throw new Error(`Invalid plan id: ${planId}`);
        }
        if (sourceIdx < 0 || destIdx < 0) {
          throw new Error(`Invalid index: ${sourceIdx} or ${destIdx}`);
        }

        break;
      }
      default:
        throw new Error(`Invalid term action: ${action}`);
    }
  }

  if (isCourseTakenAction(action)) {
    switch (action.type) {
      case "userData/setCourseTaken": {
        const courseTakenErrors = Object.keys(action.payload).reduce(
          (acc: { [subjectCode: string]: string[] }, subjectCode: string) => {
            const errors: string[] = [];
            if (typeof subjectCode !== "string" || subjectCode.length !== 4) {
              errors.push(`Invalid subject code: ${subjectCode}`);
            }
            const courseIds = new Set(action.payload.get(subjectCode));
            if (courseIds.size !== action.payload.get(subjectCode)?.length) {
              errors.push(`Duplicate course ids in course taken: ${courseIds}`);
            }
            courseIds.forEach((courseId: string) => {
              if (
                typeof courseId !== "string" ||
                courseId.slice(0, 4) !== subjectCode
              ) {
                errors.push(`Invalid course id in course taken: ${courseId}`);
              }
            });
            if (errors.length > 0) {
              acc[subjectCode] = errors;
            }
            return acc;
          },
          {} as { [subjectCode: string]: string[] },
        );

        if (Object.keys(courseTakenErrors).length > 0) {
          throw new Error(
            `Invalid course taken: ${JSON.stringify(courseTakenErrors, null, 2)}`,
          );
        }

        break;
      }
      case "userData/addCourseTaken": {
        const courseIds = action.payload;
        if (courseIds.some((id: string) => typeof id !== "string")) {
          throw new Error(`Invalid course id: ${courseIds}`);
        }
        const courseTaken = state.userData.courseTaken;

        const errors: string[] = [];
        const cachedSubjectMap = new Map<string, Set<string>>();
        courseIds.toSorted().forEach((id: string) => {
          const subjectCode = getSubjectCode(id);
          if (subjectCode === undefined) {
            errors.push(`Invalid course id: ${id}`);
          }
          if (!cachedSubjectMap.has(subjectCode)) {
            const vals = courseTaken.has(subjectCode)
              ? courseTaken.get(subjectCode)
              : [];
            cachedSubjectMap.set(subjectCode, new Set(vals));
          }
          if (cachedSubjectMap.get(subjectCode)?.has(id)) {
            errors.push(id);
          }
          cachedSubjectMap.get(subjectCode)?.add(id);
        });
        if (errors.length > 0) {
          throw new Error(`Duplicate course ids: ${errors.join(", ")}`);
        }

        break;
      }
      case "userData/removeCourseTaken": {
        const courseIds = action.payload;
        if (courseIds.some((id: string) => typeof id !== "string")) {
          throw new Error(`Invalid course id: ${courseIds}`);
        }

        break;
      }
      default:
        throw new Error(`Invalid course taken action: ${action}`);
    }
  }

  if (isCourseAction(action)) {
    switch (action.type) {
      case "userData/addCourse": {
        const { courseIds, termId, planId } = action.payload;
        if (!isValidObjectId(termId)) {
          throw new Error(`Invalid term id: ${termId}`);
        }
        if (!state.userData.termData.has(termId)) {
          throw new Error(`Term id not found in term data: ${termId}`);
        }
        if (!isValidObjectId(planId)) {
          throw new Error(`Invalid plan id: ${planId}`);
        }
        if (
          state.userData.termData.get(termId)!.courseIds.length >=
          MAX_COURSE_PER_TERM
        ) {
          throw new Error(
            `Max course per term reached: ${MAX_COURSE_PER_TERM}`,
          );
        }
        const plan = state.userData.planData.get(planId)!;
        const duplicateCourseIds = courseIds.filter((id: string) =>
          plan.courseMetadata.has(id),
        );
        if (duplicateCourseIds.length > 0) {
          throw new Error(
            `Duplicate course ids: ${duplicateCourseIds.join(", ")}`,
          );
          // TODO: toast duplicate course ids
        }
        break;
      }
      case "userData/deleteCourse": {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { courseId, termId, planId } = action.payload;
        if (!isValidObjectId(termId) || !state.userData.planData.has(planId)) {
          throw new Error(`Invalid term id: ${termId}`);
        }
        if (!isValidObjectId(planId) || !state.userData.termData.has(termId)) {
          throw new Error(`Invalid plan id: ${planId}`);
        }

        break;
      }
      case "userData/moveCourse": {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { courseId, sourceTermId, destTermId, sourceIdx, destIdx } =
          action.payload;
        if (!isValidObjectId(sourceTermId)) {
          throw new Error(`Invalid source term id: ${sourceTermId}`);
        }
        if (!isValidObjectId(destTermId)) {
          throw new Error(`Invalid dest term id: ${destTermId}`);
        }
        if (sourceIdx < 0 || destIdx < 0) {
          throw new Error(`Invalid index: ${sourceIdx} or ${destIdx}`);
        }

        break;
      }
      default:
        throw new Error(`Invalid course action: ${action}`);
    }
  }

  if (isLocalDataAction(action)) {
    switch (action.type) {
      case "localData/setCurrentPlanId": {
        const planId = action.payload;
        if (!isValidObjectId(planId)) {
          throw new Error(`Invalid plan id: ${planId}`);
        }
        if (!state.userData.planData.has(planId)) {
          throw new Error(`Plan id not found in plan data: ${planId}`);
        }

        break;
      }
      default:
        break; // TODO add other validations
    }
  }

  return next(action);
};

export default validationMiddleware;
