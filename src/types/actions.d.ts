import { termSlice } from "@/store/slices/termSlice";
import { courseTakenSlice } from "@/store/slices/courseTakenSlice";
import { planSlice } from "@/store/slices/planSlice";
import { assistantSlice } from "@/store/slices/assistantSlice";

type TermAction = ReturnType<typeof termSlice.actions[keyof typeof termSlice.actions]>
type CourseTakenAction = ReturnType<typeof courseTakenSlice.actions[keyof typeof courseTakenSlice.actions]>
type PlanAction = ReturnType<typeof planSlice.actions[keyof typeof planSlice.actions]>
type AssistantAction = ReturnType<typeof assistantSlice.actions[keyof typeof assistantSlice.actions]>

export type { TermAction, CourseTakenAction, PlanAction, AssistantAction }