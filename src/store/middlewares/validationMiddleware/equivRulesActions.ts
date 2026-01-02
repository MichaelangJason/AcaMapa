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
  const isValidRule = (courseId: string, equivCourseId: string) => {
    return isValidCourseId(courseId) && isValidCourseId(equivCourseId);
  };
  const existingRules = state.userData.equivRules;

  switch (action.type) {
    case "userData/setEquivRules": {
      const rules = action.payload;

      for (const rule of rules) {
        if (!isValidRule(rule[0], rule[1])) {
          throw new Error(`Invalid rule: ${rule}`);
        }
      }

      break;
    }
    case "userData/addEquivRule": {
      const [courseId, equivCourseId] = action.payload;

      if (!isValidRule(courseId, equivCourseId)) {
        throw new Error(`Invalid rule: ${courseId} <=> ${equivCourseId}`);
      }

      const thisRule = new Set([courseId, equivCourseId]);

      for (const r of existingRules) {
        if (thisRule.has(r[0]) && thisRule.has(r[1])) {
          throw new Error(
            `Rule already exists: ${courseId} <=> ${equivCourseId}`,
          );
        }
      }

      break;
    }
    case "userData/removeEquivRule": {
      const idx = action.payload;

      if (idx < 0 || idx >= existingRules.length) {
        throw new Error(`Invalid index: ${idx}`);
      }

      if (!isValidRule(existingRules[idx][0], existingRules[idx][1])) {
        throw new Error(
          `Invalid rule: ${existingRules[idx][0]} <=> ${existingRules[idx][1]}`,
        );
      }

      break;
    }
  }
};
