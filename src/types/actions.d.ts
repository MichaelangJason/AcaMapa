import { termSlice } from "@/store/slices/termSlice";
import { courseTakenSlice } from "@/store/slices/courseTakenSlice";
import { planSlice } from "@/store/slices/planSlice";

type TermAction = ReturnType<typeof termSlice.actions[keyof typeof termSlice.actions]>
type CourseTakenAction = ReturnType<typeof courseTakenSlice.actions[keyof typeof courseTakenSlice.actions]>
type PlanAction = ReturnType<typeof planSlice.actions[keyof typeof planSlice.actions]>

export type { TermAction, CourseTakenAction, PlanAction }