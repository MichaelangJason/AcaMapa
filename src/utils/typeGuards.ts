import type { initialState as TermsState } from '@/store/slices/termSlice'

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
