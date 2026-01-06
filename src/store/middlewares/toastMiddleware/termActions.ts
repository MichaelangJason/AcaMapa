import { type Language, t, I18nKey } from "@/lib/i18n";
import { isTermAction } from "@/lib/typeGuards";
import { toast } from "react-toastify";
import { startListening } from "./core";

startListening({
  predicate: (action) => isTermAction(action),
  effect: (action, listenerApi) => {
    const lang = listenerApi.getState().userData.lang as Language;
    const isToastEnabled = listenerApi.getState().global.isToastEnabled;

    if (!isToastEnabled) return;
    const originalState = listenerApi.getOriginalState();

    switch (action.type) {
      case "userData/addTerm": {
        toast.success(
          t([I18nKey.NEW_M, I18nKey.SEMESTER, I18nKey.CREATED_M], lang),
        );
        break;
      }
      case "userData/deleteTerm": {
        const { termId } = action.payload;
        const termName = originalState.userData.termData.get(termId)!.name;
        toast.success(
          t([I18nKey.SEMESTER, I18nKey.P_SEMESTER, I18nKey.REMOVED_M], lang, {
            semester: termName,
          }),
        );
        break;
      }
      case "userData/renameTerm": {
        const { termId, newName } = action.payload;
        const oldName = originalState.userData.termData.get(termId)!.name;
        toast.success(
          t([I18nKey.SEMESTER, I18nKey.RENAMED_TO_M], lang, {
            item1: oldName,
            item2: newName,
          }),
        );
        break;
      }
      default:
        break;
    }
  },
});
