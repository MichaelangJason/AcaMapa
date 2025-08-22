import { useCallback, useState } from "react";
import Wrapper from "./Wrapper";
import MiniCourseCard from "./MiniCourseCard";
import ReqNotes from "./ReqNotes";
import FootNote from "./FootNote";
import { I18nKey, Language, t } from "@/lib/i18n";
import { Course } from "@/types/db";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { isValidCourse } from "@/lib/typeGuards";
import { ReqType } from "@/lib/enums";
import {
  addSelectedCourse,
  removeSelectedCourse,
} from "@/store/slices/localDataSlice";
import { selectCourseDepMeta } from "@/store/selectors";
import { useMemo } from "react";

const DetailedInfoCard = ({
  heading,
  subheading,
  courseIds,
  hideCourses = false,
  notes,
  credits,
}: {
  heading: string;
  subheading: string;
  courseIds: string[];
  hideCourses?: boolean;
  notes: string[];
  credits: number;
}) => {
  const [isExpanded, setIsExpanded] = useState(true); // default to expanded
  const hasContent = (courseIds.length > 0 && !hideCourses) || notes.length > 0;
  const lang = useAppSelector((state) => state.userData.lang) as Language;
  const courseData = useAppSelector((state) => state.localData.courseData);
  const selectedCourses = useAppSelector(
    (state) => state.localData.selectedCourses,
  );
  const dispatch = useAppDispatch();
  const { getCourseSource } = useAppSelector(selectCourseDepMeta);

  const presentCredits = useMemo(() => {
    const presentCredits = courseIds.reduce((acc, id) => {
      const courseId = id.replace(" ", "");
      const { source } = getCourseSource(courseId, "", null, false);
      if (!source) return acc;

      const course = courseData[courseId];
      return acc + course.credits;
    }, 0);
    return presentCredits;
  }, [getCourseSource, courseData, courseIds]);

  const handleAddCourse = useCallback(
    async (course: Course, isSelected: boolean) => {
      if (isSelected) {
        dispatch(removeSelectedCourse(course));
      } else {
        dispatch(addSelectedCourse(course));
      }
    },
    [dispatch],
  );

  return (
    <Wrapper
      heading={heading}
      subheading={subheading}
      credits={`${presentCredits.toString()}/${credits.toString()}`}
      isExpanded={isExpanded}
      toggleIsExpanded={() => setIsExpanded((prev) => !prev)}
      className="detailed-info"
    >
      {!hideCourses &&
        courseIds.map((id) => {
          const courseId = id.replace(" ", "");
          const course = courseData[courseId];
          if (!isValidCourse(course)) return null;
          return (
            <MiniCourseCard
              key={courseId}
              data={course}
              isSelected={selectedCourses.has(courseId)}
              callback={handleAddCourse}
            />
          );
        })}
      {notes.length > 0 && (
        <ReqNotes
          notes={notes}
          title={t([I18nKey.NOTES], lang)}
          type={ReqType.NOTES}
        />
      )}
      {!hasContent && <FootNote content={t([I18nKey.EMPTY], lang)} />}
    </Wrapper>
  );
};

export default DetailedInfoCard;
