import type { initialState as TermsState } from '@/store/slices/termSlice'
import type { initialState as CourseTakenState } from '@/store/slices/courseTakenSlice'

export const isValidTermsState = (plans: unknown): plans is typeof TermsState => {
  if (!plans || typeof plans !== 'object') return false;
  
  const p = plans as typeof TermsState;
  
  return (
    'data' in p &&
    'order' in p &&
    'inTermCourseIds' in p &&
    Array.isArray(p.order) &&
    Array.isArray(p.inTermCourseIds) &&
    typeof p.data === 'object'
  );
}

export const isValidCourseTaken = (courseTaken: unknown): courseTaken is typeof CourseTakenState => {
  if (!courseTaken || typeof courseTaken !== 'object') return false

  const c = courseTaken as typeof CourseTakenState;
  
  const keySatisfied = Object.keys(c).every(key => key.length === 4);
  const idSatisfied = Object.values(c).flat().every(id => typeof id === 'string')

  return keySatisfied && idSatisfied;
}
