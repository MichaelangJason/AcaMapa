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
  const isValidRule = (rule: [string, string]) => {
    return isValidCourseId(rule[0]) && isValidCourseId(rule[1]);
  };
  const existingRules = state.userData.equivRules;

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
        throw new Error(`Invalid rule: ${rule[0]} <=> ${rule[1]}`);
      }

      const thisRule = new Set(rule);

      for (const r of existingRules) {
        if (thisRule.has(r[0]) && thisRule.has(r[1])) {
          throw new Error(`Rule already exists: ${rule[0]} <=> ${rule[1]}`);
        }
      }

      break;
    }
    case "userData/removeEquivRule": {
      const idx = action.payload;

      if (idx < 0 || idx >= existingRules.length) {
        throw new Error(`Invalid index: ${idx}`);
      }

      if (!isValidRule(existingRules[idx])) {
        throw new Error(
          `Invalid rule: ${existingRules[idx][0]} <=> ${existingRules[idx][1]}`,
        );
      }

      break;
    }
  }
};
