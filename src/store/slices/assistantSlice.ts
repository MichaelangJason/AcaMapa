import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export const initialState = {
  threadIds: [] as string[], // list of local saved thread ids
  currentThreadId: null as string | null, // current thread id
}

const assistantSlice = createSlice({
  name: 'assistant',
  initialState,
  reducers: {
    addThreadId: (state, action: PayloadAction<string>) => {
      if (!state.threadIds.includes(action.payload)) {
        state.threadIds.push(action.payload)
      }
    },
    removeThreadId: (state, action: PayloadAction<string>) => {
      state.threadIds = state.threadIds.filter(id => id !== action.payload)
    },
    setThreadIds: (state, action: PayloadAction<string[]>) => {
      state.threadIds = action.payload
    },
    setCurrentThreadId: (state, action: PayloadAction<string | null>) => {
      state.currentThreadId = action.payload
    },
  },
})

export const { addThreadId, removeThreadId, setThreadIds, setCurrentThreadId } = assistantSlice.actions
export default assistantSlice.reducer
