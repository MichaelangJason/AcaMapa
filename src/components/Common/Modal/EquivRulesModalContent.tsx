"use client";

import type { CommonModalProps, EquivRuleModalProps } from "@/types/modals";
import { t, I18nKey, type Language } from "@/lib/i18n";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import clsx from "clsx";
import { useRef, useState, useCallback, useEffect } from "react";
import { selectCourseSearchFn } from "@/store/selectors";
import { formatCourseId } from "@/lib/utils";
import { useDebounce } from "@/lib/hooks/common";
import { addEquivRule } from "@/store/slices/userDataSlice";
import { createEquivRule } from "@/lib/course";

const EquivRulesModalContent = ({
  closeCb,
}: EquivRuleModalProps & CommonModalProps) => {
  const dispatch = useAppDispatch();
  const lang = useAppSelector((state) => state.userData.lang) as Language;
  const courseData = useAppSelector((state) => state.localData.courseData);
  const courseSearchFn = useAppSelector(selectCourseSearchFn);
  const formRef = useRef<HTMLFormElement>(null);
  const [availableCourses, setAvailableCourses] = useState<string[]>([]);

  const getAvailableCourses = useDebounce(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const input = event.target.value.trim().toLowerCase();

      if (!courseSearchFn || input.length < 2) return;

      const result = await courseSearchFn(input, 5);
      setAvailableCourses(result.map((id) => formatCourseId(id)));
    },
    100,
  );

  const clearAvailableCourses = useCallback(() => {
    setAvailableCourses([]);
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!formRef.current) return;
      // validate form
      const formData = new FormData(formRef.current);
      let courseId1 = formData.get("equiv-course-1") as string;
      let courseId2 = formData.get("equiv-course-2") as string;

      console.log(formData);
      console.log(courseId1, courseId2);

      if (!courseId1 || !courseId2) {
        alert("Please enter both course ids");
        return;
      }

      courseId1 = courseId1.replace(/\s+/g, "").toLowerCase();
      courseId2 = courseId2.replace(/\s+/g, "").toLowerCase();

      if (courseId1 === courseId2) {
        alert("Course ids cannot be the same");
        return;
      }

      if (!courseData[courseId1]) {
        alert(`${courseId1} not found`);
        return;
      }

      if (!courseData[courseId2]) {
        alert(`${courseId2} not found`);
        return;
      }

      dispatch(addEquivRule(createEquivRule(courseId1, courseId2)));
      closeCb();
    },
    [courseData, courseSearchFn, dispatch],
  );

  // focus on the first input at mount
  useEffect(() => {
    setTimeout(() => {
      formRef.current
        ?.querySelector<HTMLInputElement>("#equiv-course-1")
        ?.focus();
    }, 10);
  }, []);

  return (
    <>
      {/* header */}
      <header>
        <h3>{t([I18nKey.EQUIV_RULES], lang)}</h3>
      </header>

      <form
        className="equiv-rules-form"
        ref={formRef}
        id="equiv-rules-form"
        onSubmit={handleSubmit}
      >
        <label htmlFor="equiv-course-1">Enter course id:</label>
        <input
          type="text"
          name="equiv-course-1"
          id="equiv-course-1"
          list="available-courses"
          autoComplete="off"
          onFocus={getAvailableCourses}
          onChange={getAvailableCourses}
          onBlur={clearAvailableCourses}
        />
        <br />
        <label htmlFor="equiv-course-2">Enter equivalent course id:</label>
        <input
          type="text"
          name="equiv-course-2"
          id="equiv-course-2"
          list="available-courses"
          autoComplete="off"
          onFocus={getAvailableCourses}
          onChange={getAvailableCourses}
          onBlur={clearAvailableCourses}
        />

        <datalist id="available-courses">
          {availableCourses.map((course) => (
            <option key={course} value={course} />
          ))}
        </datalist>
      </form>

      {/* footer, includes cancel/confirm buttons */}
      <footer>
        <button className="cancel-button" onClick={closeCb}>
          {t([I18nKey.CANCEL], lang)}
        </button>

        <button
          className={clsx("confirm-button")}
          type="submit"
          form="equiv-rules-form"
        >
          {t([I18nKey.CONFIRM], lang)}
        </button>
      </footer>
    </>
  );
};

export default EquivRulesModalContent;
