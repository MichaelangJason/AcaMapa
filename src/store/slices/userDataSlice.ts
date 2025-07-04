import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState = {
  courseTaken: new Map<string, string[]>(),
};

// TODO: add other slices
const userDataSlice = createSlice({
  name: "userData",
  initialState,
  reducers: {
    setCourseTaken: (
      state,
      action: PayloadAction<{ [subjectCode: string]: string[] }>,
    ) => {
      state.courseTaken = new Map(Object.entries(action.payload));
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
  },
});

export const { setCourseTaken, addCourseTaken, removeCourseTaken } =
  userDataSlice.actions;

export default userDataSlice.reducer;
