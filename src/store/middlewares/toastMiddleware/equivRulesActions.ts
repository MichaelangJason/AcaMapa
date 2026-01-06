import { Language, t, I18nKey } from "@/lib/i18n";
import { isEquivRulesAction } from "@/lib/typeGuards";
import { toast } from "react-toastify";
import { startListening } from "./core";
import { formatRule } from "@/lib/course/dependency/equivalents";

startListening({
  predicate: (action) => isEquivRulesAction(action),
  effect: (action, listenerApi) => {
    const lang = listenerApi.getState().userData.lang as Language;
    const isToastEnabled = listenerApi.getState().global.isToastEnabled;

    if (!isToastEnabled) return;

    switch (action.type) {
      case "userData/addEquivRule": {
        const rule = action.payload;
        toast.success(
          t([I18nKey.EQUIV_RULE_ADDED, I18nKey.P_ITEM1], lang, {
            item1: formatRule(rule),
          }),
        );
        break;
      }
      case "userData/removeEquivRule": {
        const idx = action.payload;
        const existingRules =
          listenerApi.getOriginalState().userData.equivRules;
        const rule = existingRules[idx];
        if (!rule) {
          throw new Error(`Invalid index: ${idx}`);
        }
        toast.success(
          t([I18nKey.EQUIV_RULE_REMOVED, I18nKey.P_ITEM1], lang, {
            item1: formatRule(rule),
          }),
        );
        break;
      }
      default:
        break;
    }
  },
});
