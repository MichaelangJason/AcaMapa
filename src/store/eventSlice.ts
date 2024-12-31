import { DraggingType } from "@/utils/enums";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const eventSlice = createSlice({
  name: "event",
  initialState: {
    draggingType: null as DraggingType | null,
    addingCourseId: null as string | null,
    droppableId: null as string | null,
  },
  reducers: {
    setDraggingType: (state, action: PayloadAction<DraggingType | null>) => {
      state.draggingType = action.payload;
    },
    setAddingCourseId: (state, action: PayloadAction<string | null>) => {
      state.addingCourseId = action.payload;
    },
    setDroppableId: (state, action: PayloadAction<string | null>) => {
      state.droppableId = action.payload;
    },
  },
});

export const { setDraggingType, setAddingCourseId, setDroppableId } = eventSlice.actions;

export default eventSlice.reducer;
