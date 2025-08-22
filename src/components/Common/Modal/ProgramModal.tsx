"use client";

import Modal from "react-modal";
import { useCallback, useEffect, useRef, useState } from "react";
import CloseIcon from "@/public/icons/delete.svg";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { clearIsProgramModalOpen } from "@/store/slices/localDataSlice";
import { I18nKey, Language, t } from "@/lib/i18n";
import { useDebounce } from "@/lib/hooks";
import ScrollBar from "../ScrollBar";
import { PROGRAM_RESULT_PER_PAGE } from "@/lib/constants";
import FootNote from "../../Course/CourseCard/FootNote";
import { SearchInput } from "../SideBar";
import { selectProgramSearchFn } from "@/store/selectors";
import { MiniProgramCard } from "@/components/Program";
import { removeProgram } from "@/store/slices/userDataSlice";
import { addProgramToUser, seekProgram } from "@/store/thunks";

Modal.setAppElement("html");

const ProgramModal = () => {
  const dispatch = useAppDispatch();
  const lang = useAppSelector((state) => state.userData.lang) as Language;
  const programData = useAppSelector((state) => state.localData.programData);
  const programSearchFn = useAppSelector(selectProgramSearchFn);
  const isProgramModalOpen = useAppSelector(
    (state) => state.localData.isProgramModalOpen,
  );
  const [input, setInput] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<string[]>([]);
  const resultContainerRef = useRef<HTMLDivElement>(null);
  const [hasMore, setHasMore] = useState(true);
  const loadingTriggerRef = useRef<HTMLDivElement>(null);
  const isAdding = useAppSelector((state) => state.global.isAdding);

  const userPrograms = useAppSelector((state) => state.userData.programs);

  const isProgramSelected = useCallback(
    (programName: string) => {
      return userPrograms.some((program) => program === programName);
    },
    [userPrograms],
  );

  const handleClose = useCallback(() => {
    dispatch(clearIsProgramModalOpen());
    setInput("");
    setPage(1);
    setResult([...Object.keys(programData)]);
  }, [dispatch, programData]);

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
        handleClose();
      }
    },
    [dispatch, handleClose, isAdding],
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
      }, 500);
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
    <Modal
      isOpen={isProgramModalOpen}
      shouldCloseOnOverlayClick={true}
      shouldCloseOnEsc={true}
      onRequestClose={handleClose}
      className="program-modal-content"
      overlayClassName="modal-overlay"
    >
      <header>
        <h3>{t([I18nKey.SEARCH_PROGRAMS], lang)}</h3>
        <button onClick={handleClose}>
          <CloseIcon />
        </button>
      </header>

      <section className="program-search">
        <SearchInput
          value={input}
          setValue={(value) => setInput(value)}
          callback={handleSearchProgram}
          placeholder={t([I18nKey.SEARCH_PROGRAM_INPUT_PLACEHOLDER], lang)}
          className="program"
          isDisabled={isAdding}
        />

        <div className="result-container scrollbar-hidden">
          <div
            className="inner-container scrollbar-hidden scroll-mask"
            ref={resultContainerRef}
          >
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

            {result.length === 0 && (
              <FootNote content={t([I18nKey.NO_RESULTS], lang)} />
            )}
            {hasMore && (
              <div className="loading-placeholder" ref={loadingTriggerRef}>
                {t([I18nKey.LOADING_MORE], lang)}
              </div>
            )}
          </div>
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

      <footer>
        <button className="cancel-button" onClick={handleClose}>
          {t([I18nKey.CLOSE], lang)}
        </button>
      </footer>
    </Modal>
  );
};

export default ProgramModal;
