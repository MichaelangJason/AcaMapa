import { CONST_STR } from "@/lib/constants";
import { ReqType } from "@/lib/enums";
import { type Language, t, I18nKey } from "@/lib/i18n";
import { formatCourseId } from "@/lib/utils";
import type { AppStore } from "@/store";

export const getTagStatus = (source: string, isValid: boolean) => {
  return !source ? undefined : isValid ? "satisfied" : "unsatisfied";
};

const _getTagToolTip = (source: string, isValid: boolean, lang: Language) => {
  if (source === "") {
    return t([I18nKey.ADD_TO, I18nKey.OR, I18nKey.ADD_TO_SELECTED], lang, {
      item1: t([I18nKey.COURSE_TAKEN], lang),
    });
  }
  if (source === CONST_STR.COURSE_TAKEN) {
    source = t([I18nKey.COURSE_TAKEN], lang);
  }
  return isValid
    ? t([I18nKey.VALID_PLACE], lang, { item1: source })
    : t([I18nKey.INVALID_PLACE], lang, { item1: source });
};

export const getTagToolTip = ({
  store,
  isEquiv = false,
  reqType,
  courseId,
  source,
  isValid,
  lang,
}: {
  store: AppStore;
  courseId: string;
  source: string;
  isValid: boolean;
  lang: Language;
  isEquiv: boolean;
  reqType: ReqType | null; // only used for anti-req
}) => {
  if (isEquiv) {
    if (reqType === ReqType.ANTI_REQ) {
      return t([I18nKey.EQUIV_COURSE_FOUND], lang, {
        item1: isValid ? t([I18nKey.VALID], lang) : t([I18nKey.INVALID], lang),
        item2: formatCourseId(courseId),
      });
    } else {
      return t([I18nKey.EQUIV_COURSE_SATISFIED], lang, {
        item1: formatCourseId(courseId),
      });
    }
  } else {
    if (source !== CONST_STR.COURSE_TAKEN) {
      source = store.getState().userData.termData.get(source)?.name ?? source;
    }
    return _getTagToolTip(source, isValid, lang);
  }
};
