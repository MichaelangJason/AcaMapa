"use client";
import { ItemTag } from "@/components/Common";
import { TooltipId } from "@/lib/enums";
import { t, I18nKey, type Language } from "@/lib/i18n";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setIsProgramModalOpen } from "@/store/slices/localDataSlice";
import { removeProgram } from "@/store/slices/userDataSlice";
import { seekProgram } from "@/store/thunks";
import { useCallback } from "react";

const ProgramsTag = () => {
  const dispatch = useAppDispatch();
  const programs = useAppSelector((state) => state.userData.programs);
  const lang = useAppSelector((state) => state.userData.lang) as Language;

  const handleClickProgram = useCallback(
    async (programName: string) => {
      await dispatch(seekProgram(programName));
    },
    [dispatch],
  );

  const handleAddProgram = useCallback(() => {
    dispatch(setIsProgramModalOpen(true));
  }, [dispatch]);

  const handleDeleteProgram = useCallback(
    (programName: string) => {
      dispatch(removeProgram([programName]));
    },
    [dispatch],
  );

  return (
    <ItemTag
      items={programs}
      handleClickItem={handleClickProgram}
      handleDeleteItem={handleDeleteProgram}
      handleAddItem={handleAddProgram}
      handleSeekItem={handleClickProgram}
      className="program-tag"
      title={t([I18nKey.PROGRAM], lang) + "s"}
      tooltipProps={{
        "data-tooltip-id": TooltipId.ITEM_TAG,
        "data-tooltip-place": "right",
      }}
      isPinnable={true}
    />
  );
};

export default ProgramsTag;
