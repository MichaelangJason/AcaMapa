import { Course } from "@/types/db";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
    credentials: "include",
  }),
  endpoints: (builder) => ({
    getCourse: builder.query<Course, string[]>({
      query: (courseIds: string[]) => ({
        url: "/courses",
        params: { ids: courseIds.join(".") },
      }),
    }),
  }),
});

export const { useGetCourseQuery } = apiSlice;

export default apiSlice;
