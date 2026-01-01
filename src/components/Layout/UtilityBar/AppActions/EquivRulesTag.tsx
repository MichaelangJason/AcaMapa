import { ItemTag } from "@/components/Common";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
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
    // TODO: add a rule
  }, []);

  const handleDeleteRule = useCallback((rule: string) => {
    // TODO: delete a rule
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
      isPinnable={false}
    />
  );
};

export default EquivRulesTag;
