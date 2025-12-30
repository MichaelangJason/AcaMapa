import { parseRule } from "@/lib/course";
import type { RootState } from "@/store";
import type { EquivRulesAction } from "@/types/actions";

export const handleEquivRulesAction = (
  action: EquivRulesAction,
  state: RootState,
) => {
  const courseData = state.localData.courseData;

  const isValidCourseId = (id: string) => {
    return courseData[id] !== undefined;
  };
  const isValidRule = (rule: string) => {
    const [courseId, equivCourseId] = parseRule(rule);
    return isValidCourseId(courseId) && isValidCourseId(equivCourseId);
  };

  switch (action.type) {
    case "userData/setEquivRules": {
      const rules = action.payload;

      for (const rule of rules) {
        if (!isValidRule(rule)) {
          throw new Error(`Invalid rule: ${rule}`);
        }
      }

      break;
    }
    case "userData/addEquivRule": {
      const rule = action.payload;
      if (!isValidRule(rule)) {
        throw new Error(`Invalid rule: ${rule}`);
      }

      break;
    }
    case "userData/removeEquivRule": {
      const idx = action.payload;
      if (idx < 0 || idx >= state.userData.equivRules.length) {
        throw new Error(`Invalid index: ${idx}`);
      }
    }
  }
};
