import type { initialState as TermsState } from '@/store/slices/termSlice'
import type { initialState as CourseTakenState } from '@/store/slices/courseTakenSlice'
import type { initialState as PlanState } from '@/store/slices/planSlice'
import { TermAction, CourseTakenAction, PlanAction } from '@/types/actions';

export const isValidPlanState = (plans: unknown): plans is typeof PlanState => {
  if (!plans || typeof plans !== 'object') return false;

  const p = plans as typeof PlanState;
  
  return (
    'data' in p &&
    'order' in p &&
    'currentPlanId' in p &&
    Array.isArray(p.order) &&
    typeof p.data === 'object' &&
    typeof p.currentPlanId === 'string'
  );
}

export const isValidTermData = (data: unknown): data is typeof TermsState['data'] => {
  if (!data || typeof data !== 'object') return false;
  
  const d = data as typeof TermsState['data'];
  
  return Object.values(d).every(term => {
    return (
      typeof term.id === 'string' &&
      typeof term.name === 'string' &&
      Array.isArray(term.courseIds) &&
      term.courseIds.every(courseId => typeof courseId === 'string')
    )
  })
}

export const isValidCourseTaken = (courseTaken: unknown): courseTaken is typeof CourseTakenState => {
  if (!courseTaken || typeof courseTaken !== 'object') return false

  const c = courseTaken as typeof CourseTakenState;
  
  const keySatisfied = Object.keys(c).every(key => key.length === 4);
  const idSatisfied = Object.values(c).flat().every(id => typeof id === 'string')

  return keySatisfied && idSatisfied;
}


// custom type guard
export const isTermActions = (action: unknown): action is TermAction => {
  return (action as TermAction)?.type.startsWith('terms')
}
export const isCourseTakenAction = (action: unknown): action is CourseTakenAction => {
  return (action as CourseTakenAction)?.type.startsWith('courseTaken');
}
export const isPlanActions = (action: unknown): action is PlanAction => {
  return (action as PlanAction)?.type.startsWith('plans');
}