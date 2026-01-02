"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CloseIcon from "@/public/icons/delete.svg";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { I18nKey, Language, t } from "@/lib/i18n";
import { useDebounce } from "@/lib/hooks/common";
import ScrollBar from "../ScrollBar";
import { PROGRAM_RESULT_PER_PAGE } from "@/lib/constants";
import FootNote from "../../Course/CourseCard/FootNote";
import { SearchInput } from "../SideBar";
import { selectProgramSearchFn } from "@/store/selectors";
import { MiniProgramCard } from "@/components/Program";
import { removeProgram } from "@/store/slices/userDataSlice";
import { addProgramToUser, seekProgram } from "@/store/thunks";
import clsx from "clsx";
import type { ProgramModalProps, CommonModalProps } from "@/types/modals";

// program modal for searching and adding programs
const ProgramModalContent = ({
  closeCb,
}: ProgramModalProps & CommonModalProps) => {
  // dispatch
  const dispatch = useAppDispatch();
  // user language
  const lang = useAppSelector((state) => state.userData.lang) as Language;
  // program data
  const programData = useAppSelector((state) => state.localData.programData);
  // program search function
  const programSearchFn = useAppSelector(selectProgramSearchFn);
  // search input value
  const [input, setInput] = useState("");
  // page number
  const [page, setPage] = useState(1);
  // search result
  const [result, setResult] = useState<string[]>([]);
  // result container ref
  const resultContainerRef = useRef<HTMLDivElement>(null);
  // has more flag for infinite scroll
  const [hasMore, setHasMore] = useState(true);
  const loadingTriggerRef = useRef<HTMLDivElement>(null);

  // is adding a course or program, disable other adding actions
  const isAdding = useAppSelector((state) => state.global.isAdding);

  const userPrograms = useAppSelector((state) => state.userData.programs);

  // used an array filter here instead of a map lookup
  // because people are more likely to search and add programs instead of looking up programs
  const isProgramSelected = useCallback(
    (programName: string) => {
      return userPrograms.some((program) => program === programName);
    },
    [userPrograms],
  );

  const handleClickProgram = useCallback(
    async (programName: string, isSelected: boolean) => {
      if (isAdding) return;

      if (isSelected) {
        dispatch(removeProgram([programName]));
      } else {
        await dispatch(addProgramToUser([programName])).unwrap();
        const programTagElem = document.querySelector(`.program-tag`);
        if (programTagElem) {
          const openAttr = document.createAttribute("data-tag-type");
          openAttr.value = "open";
          programTagElem.attributes.setNamedItem(openAttr);
          programTagElem.querySelector("header")?.click();
        }
        await dispatch(seekProgram(programName)).unwrap();
        closeCb();
      }
    },
    [dispatch, closeCb, isAdding],
  );

  const handleSearchProgram = useCallback(
    async (input: string) => {
      if (!input.length || !programSearchFn) {
        setResult([...Object.keys(programData)]);
        return;
      }

      const result = await programSearchFn(input);
      setResult(result);
    },
    [programSearchFn, programData],
  );

  const reset = useCallback(() => {
    setPage(1);
    resultContainerRef.current?.scrollTo({ top: 0 });
  }, []);

  const debouncedReset = useDebounce(reset, 200);

  // handle infinite scroll
  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      setTimeout(() => {
        const first = entries[0];
        if (first.isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      }, 200);
    },
    [hasMore],
  );

  useEffect(() => {
    debouncedReset();
  }, [input, debouncedReset]);

  useEffect(() => {
    if (!loadingTriggerRef.current) return;

    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.5,
    });

    observer.observe(loadingTriggerRef.current);

    return () => {
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleIntersection, loadingTriggerRef.current]);

  useEffect(() => {
    setHasMore(page * PROGRAM_RESULT_PER_PAGE < result.length);
  }, [result, page]);

  return (
    <>
      <header>
        <h3>{t([I18nKey.SEARCH_PROGRAMS], lang)}</h3>
        <button onClick={closeCb}>
          <CloseIcon />
        </button>
      </header>

      <section className="program-search">
        {/* search input */}
        <SearchInput
          value={input}
          setValue={(value) => setInput(value)}
          callback={handleSearchProgram}
          placeholder={t([I18nKey.SEARCH_PROGRAM_INPUT_PLACEHOLDER], lang)}
          className="program"
          isDisabled={isAdding}
        />

        {/* result container */}
        <div className="result-container scrollbar-hidden">
          <div
            className={clsx(
              "inner-container scrollbar-hidden scroll-mask",
              hasMore && "hasMore",
            )}
            ref={resultContainerRef}
          >
            {/* result items */}
            {result
              .slice(0, page * PROGRAM_RESULT_PER_PAGE)
              .map((entry, idx) => {
                return (
                  <MiniProgramCard
                    key={idx}
                    data={programData[entry]}
                    query={input}
                    callback={handleClickProgram}
                    isSelected={isProgramSelected(entry)}
                  />
                );
              })}

            {/* no results */}
            {result.length === 0 && (
              <FootNote
                content={t([I18nKey.NO_RESULTS], lang)}
                className="program-card"
              />
            )}

            {/* loading more */}
            {hasMore && (
              <div className="loading-placeholder" ref={loadingTriggerRef}>
                {t([I18nKey.LOADING_MORE], lang)}
              </div>
            )}
          </div>

          {/* scroll bar */}
          <ScrollBar
            targetContainerRef={resultContainerRef}
            direction="vertical"
            bindScroll={(cb) => {
              if (!resultContainerRef.current) return;
              resultContainerRef.current.onscroll = cb;
            }}
            unbindScroll={() => {
              if (!resultContainerRef.current) return;
              resultContainerRef.current.onscroll = null;
            }}
          />
        </div>
      </section>
    </>
  );
};

export default ProgramModalContent;
