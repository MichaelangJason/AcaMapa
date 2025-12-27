import { Language, t, I18nKey } from "@/lib/i18n";
import { isCourseTakenAction } from "@/lib/typeGuards";
import { toast } from "react-toastify";
import { startListening } from "./core";

startListening({
  predicate: (action) => isCourseTakenAction(action),
  effect: (action, listenerApi) => {
    const lang = listenerApi.getState().userData.lang as Language;
    const isToastEnabled = listenerApi.getState().global.isToastEnabled;

    if (!isToastEnabled) return;

    switch (action.type) {
      case "userData/addCourseTaken": {
        const courseIds = action.payload;
        const courseIdsStr = courseIds.join("\n");
        toast.success(
          t([I18nKey.P_ITEM2, I18nKey.ADDED_TO_M], lang, {
            item1: t([I18nKey.COURSE_TAKEN], lang),
            item2: courseIdsStr,
          }),
        );
        break;
      }
      case "userData/removeCourseTaken": {
        const courseIds = action.payload;
        const courseIdsStr = courseIds.join("\n");
        toast.success(
          t([I18nKey.REMOVED_FROM_M], lang, {
            item1: courseIdsStr,
            item2: t([I18nKey.COURSE_TAKEN], lang),
          }),
        );
        break;
      }
      default:
        break;
    }
  },
});
