import { type Language, t, I18nKey } from "@/lib/i18n";
import { isPlanAction } from "@/lib/typeGuards";
import { setCurrentPlanId } from "@/store/slices/localDataSlice";
import { toast } from "react-toastify";
import { startListening } from "./core";

startListening({
  predicate: (action) => isPlanAction(action),
  effect: (action, listenerApi) => {
    const lang = listenerApi.getState().userData.lang as Language;
    const isToastEnabled = listenerApi.getState().global.isToastEnabled;

    if (!isToastEnabled) return;
    const originalState = listenerApi.getOriginalState();

    switch (action.type) {
      case "userData/addPlan": {
        toast.success(
          t([I18nKey.NEW_M, I18nKey.PLAN, I18nKey.CREATED_M], lang),
        );
        break;
      }
      case "userData/deletePlan": {
        const planId = action.payload;
        const planName = originalState.userData.planData.get(planId)!.name;
        toast.success(
          t([I18nKey.PLAN, I18nKey.P_PLAN, I18nKey.REMOVED_M], lang, {
            plan: planName,
          }),
        );
        break;
      }
      case "userData/renamePlan": {
        const { planId, newName } = action.payload;
        const oldName = originalState.userData.planData.get(planId)!.name;
        toast.success(
          t([I18nKey.PLAN, I18nKey.RENAMED_TO_M], lang, {
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

startListening({
  actionCreator: setCurrentPlanId,
  effect: (action, listenerApi) => {
    const lang = listenerApi.getState().userData.lang as Language;
    const isToastEnabled = listenerApi.getState().global.isToastEnabled;

    if (!isToastEnabled) return;
    const state = listenerApi.getState();

    const planId = action.payload;
    const planName = state.userData.planData.get(planId)!.name;
    toast.success(t([I18nKey.SWITCHED_TO_M], lang, { item1: planName }));
  },
});
