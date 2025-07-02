import { Course } from "@/types/db";

export const isValidCourse = (course: unknown): course is Course => {
  if (!course || typeof course !== "object") return false;

  const c = course as Course;

  return (
    typeof c.id === "string" &&
    typeof c.name === "string" &&
    typeof c.credits === "number"
  );
};
