import { ResultType } from "@/lib/enums";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export const initialState = {
  searchResult: {
    type: ResultType.DEFAULT,
    query: "",
    data: [] as any[],
  },
  searchInput: "",
};

const localStateSlice = createSlice({
  name: "localState",
  initialState,
  reducers: {
    setSearchResult: (
      state,
      action: PayloadAction<{ type: ResultType; query: string; data: any[] }>,
    ) => {
      state.searchResult = {
        ...action.payload,
        data:
          action.payload.type === ResultType.DEFAULT ? [] : action.payload.data,
      };
    },
    setSearchInput: (state, action: PayloadAction<string>) => {
      state.searchInput = action.payload;
    },
  },
});

export const { setSearchResult, setSearchInput } = localStateSlice.actions;

export default localStateSlice.reducer;
