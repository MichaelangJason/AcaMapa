import { ItemTag } from "@/components/Common";
import { ModalType } from "@/lib/enums";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setModalState } from "@/store/slices/localDataSlice";
import { removeEquivRule } from "@/store/slices/userDataSlice";
import { useCallback, useMemo } from "react";
import { formatCourseId } from "@/lib/utils";
import type { Language } from "@/lib/i18n";

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

  const formattedRules = useMemo(() => {
    return items.map((item) => {
      const [courseId, equivCourseId] = item;
      return `${formatCourseId(courseId)} <=> ${formatCourseId(equivCourseId)}`; // TODO: format the rule
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
      title="Equivalent Courses"
      items={formattedRules}
      handleAddItem={handleAddRule}
      handleDeleteItem={handleDeleteRule}
      isExport={isExport}
      displayLang={displayLang}
      className="equiv-rules-tag"
      footNote="*only count towards prerequisites & corequisites."
      pinnable={false}
    />
  );
};

export default EquivRulesTag;
