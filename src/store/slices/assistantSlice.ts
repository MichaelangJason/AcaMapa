import { Message } from '@/types/assistant'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export const initialState = {
  threadIds: [] as string[], // list of local saved thread ids
  currentThreadId: null as string | null, // current thread id
  messages: [] as Message[], // messages in the current thread
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
      if (state.currentThreadId === action.payload) {
        state.currentThreadId = null
        state.messages = []
      }
    },
    setThreadIds: (state, action: PayloadAction<string[]>) => {
      state.threadIds = action.payload
    },
    setCurrentThreadId: (state, action: PayloadAction<string | null>) => {
      state.currentThreadId = action.payload
    },
    addNewMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload)
    },
    updateLastMessage: (state, action: PayloadAction<{ content: string, options?: string[] }>) => {
      if (state.messages.length === 0) {
        throw new Error('No messages to append to')
      }

      const lastMessage = state.messages[state.messages.length - 1]
      lastMessage.content += action.payload.content
      if (action.payload.options) {
        lastMessage.options = action.payload.options
      }
    },
    setMessages: (state, action: PayloadAction<Message[]>) => {
      state.messages = action.payload
    },
    clearMessages: (state) => {
      state.messages = []
    },
  },
})

export const { addThreadId, removeThreadId, setThreadIds, setCurrentThreadId, addNewMessage, updateLastMessage, setMessages, clearMessages } = assistantSlice.actions
export default assistantSlice.reducer
