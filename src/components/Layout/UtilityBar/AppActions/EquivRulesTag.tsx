import { ItemTag } from "@/components/Common";
import { ModalType } from "@/lib/enums";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setModalState } from "@/store/slices/localDataSlice";
import { removeEquivRule } from "@/store/slices/userDataSlice";
import { useCallback, useMemo, useState } from "react";
import { formatCourseId } from "@/lib/utils";
import { type Language, I18nKey, t } from "@/lib/i18n";
import clsx from "clsx";

const LEN_THRESHOLD = 7;

const EquivRulesTag = ({
  ref,
  isExport,
  displayLang,
}: {
  ref?: React.RefObject<HTMLDivElement | null>;
  isExport?: boolean;
  displayLang?: Language;
}) => {
  const items = useAppSelector((state) => state.userData.equivRules);
  const dispatch = useAppDispatch();
  const lang = useAppSelector((state) => state.userData.lang);
  const [hasLongRules, setHasLongRules] = useState(false);

  const formattedRules = useMemo(() => {
    setHasLongRules(false);
    return items.map((item) => {
      const [courseId, equivCourseId] = item;

      if (
        courseId.length > LEN_THRESHOLD ||
        equivCourseId.length > LEN_THRESHOLD
      ) {
        setHasLongRules(true);
      }

      return `${formatCourseId(courseId)} ⇒ ${formatCourseId(equivCourseId)}`; // TODO: format the rule
    });
  }, [items]);

  const handleAddRule = useCallback(() => {
    dispatch(
      setModalState({
        isOpen: true,
        props: {
          type: ModalType.EQUIV_RULE,
        },
      }),
    );
  }, [dispatch]);

  const handleDeleteRule = useCallback(
    (_: string, idx?: number) => {
      if (idx === undefined) {
        return;
      }
      dispatch(removeEquivRule(idx));
    },
    [dispatch],
  );

  return (
    <ItemTag
      ref={ref}
      title={t([I18nKey.EQUIV_RULES], lang)}
      items={formattedRules}
      handleAddItem={handleAddRule}
      handleDeleteItem={handleDeleteRule}
      isExport={isExport}
      displayLang={displayLang}
      className={clsx(
        "equiv-rules-tag",
        items.length > 0 && !hasLongRules && "smaller-border-radius",
      )}
      footNote="*count towards prerequisites, corequisites, and restrictions."
      pinnable={false}
    />
  );
};

export default EquivRulesTag;
