import { ItemTag } from "@/components/Common";
import { ModalType } from "@/lib/enums";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setModalState } from "@/store/slices/localDataSlice";
import { removeEquivRule } from "@/store/slices/userDataSlice";
import { useCallback, useMemo } from "react";

const EquivRulesTag = ({
  ref,
}: {
  ref?: React.RefObject<HTMLDivElement | null>;
}) => {
  const items = useAppSelector((state) => state.userData.equivRules);
  const dispatch = useAppDispatch();

  const formattedRules = useMemo(() => {
    return items.map((item) => {
      return item; // TODO: format the rule
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
  }, []);

  const handleDeleteRule = useCallback((rule: string) => {
    dispatch(removeEquivRule(rule));
  }, []);

  return (
    <ItemTag
      ref={ref}
      title="Equivalent Courses"
      items={formattedRules}
      handleAddItem={handleAddRule}
      handleDeleteItem={handleDeleteRule}
      className="equiv-rules-tag"
      pinnable
    />
  );
};

export default EquivRulesTag;
