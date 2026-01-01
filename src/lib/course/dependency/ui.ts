import { type Language, t, I18nKey } from "@/lib/i18n";

export const getTagStatus = (source: string, isValid: boolean) => {
  return source === "" ? undefined : isValid ? "satisfied" : "unsatisfied";
};

const _getTagToolTip = (source: string, isValid: boolean, lang: Language) => {
  if (source === "") {
    return t([I18nKey.ADD_TO, I18nKey.OR, I18nKey.ADD_TO_SELECTED], lang, {
      item1: t([I18nKey.COURSE_TAKEN], lang),
    });
  }
  if (source === "Course Taken") {
    source = t([I18nKey.COURSE_TAKEN], lang);
  }
  return isValid
    ? t([I18nKey.VALID_PLACE], lang, { item1: source })
    : t([I18nKey.INVALID_PLACE], lang, { item1: source });
};

export const getTagToolTip = (
  courseId: string,
  source: string,
  isValid: boolean,
  lang: Language,
  isEquiv = false,
) => {
  // eslint-disable-next-line prefer-const
  let tooltip = _getTagToolTip(source, isValid, lang);

  if (isEquiv) {
    // TODO: add equivalent courses tooltip
  }

  return tooltip;
};
