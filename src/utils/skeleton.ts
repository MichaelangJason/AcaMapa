
export const getTermCardConfig = () => {
  const CONFIGS = [1, 2, 3]
  const NUM_COURSE_TAG = 3
  const NUM_NOTES = 1

  const mockConfigs = CONFIGS.map((val) => 
    Array(val).fill(null).map(() => {
      return { numCourseTag: NUM_COURSE_TAG, numNotes: NUM_NOTES }
    })
  )
  
  return mockConfigs
}