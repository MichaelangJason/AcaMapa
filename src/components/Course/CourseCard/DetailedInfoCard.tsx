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
import clsx from "clsx";

/**
 * Used to display one section of a program card
 * @param heading - heading of the program section
 * @param subheading - subheading of the program section
 * @param courseIds - ids of the courses in the program section
 * @param hideCourses - whether to hide the courses in the program (used for metadata)
 * @param notes - notes of the program section
 * @param credits - total credits of the program section
 * @param className - class name of the card
 * @returns
 */
const DetailedInfoCard = ({
  heading,
  subheading,
  courseIds,
  hideCourses = false,
  notes,
  credits,
  className,
}: {
  heading: string;
  subheading: string;
  courseIds: string[];
  hideCourses?: boolean;
  notes: string[];
  credits: number;
  className?: string;
}) => {
  const [isExpanded, setIsExpanded] = useState(true); // default to expanded
  const lang = useAppSelector((state) => state.userData.lang) as Language;
  const courseData = useAppSelector((state) => state.localData.courseData);
  const selectedCourses = useAppSelector(
    (state) => state.localData.selectedCourses,
  );
  const dispatch = useAppDispatch();
  const { getCourseSource } = useAppSelector(selectCourseDepMeta);

  // aggregate credits of the courses of this section that are present in the plan
  const presentCredits = useMemo(() => {
    return courseIds.reduce((acc, id) => {
      const courseId = id.replace(" ", "");
      const { source } = getCourseSource(courseId, "", null, false);
      if (!source) return acc;

      const course = courseData[courseId];
      return acc + course.credits;
    }, 0);
  }, [getCourseSource, courseData, courseIds]);

  // handle the addition or removal of a course
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

  // whether the section has content to display
  const showCourses = !hideCourses && courseIds.length > 0;
  const showNotes = notes.length > 0;

  return (
    // wrapper component setup for the program section card
    <Wrapper
      heading={heading}
      subheading={subheading}
      credits={`${presentCredits.toString()}/${credits.toString()}`}
      isExpanded={isExpanded}
      toggleIsExpanded={() => setIsExpanded((prev) => !prev)}
      className={clsx("detailed-info program-section", className)}
    >
      {/* if not hiding courses, display the courses */}
      {showCourses &&
        courseIds.map((id) => {
          // OPTIMIZE: normalize course id in db
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

      {/* if there are notes, display the notes */}
      {showNotes ? (
        <ReqNotes
          notes={notes}
          title={t([I18nKey.NOTES], lang)}
          type={ReqType.NOTES}
        />
      ) : (
        <FootNote content={t([I18nKey.NO_NOTES], lang)} />
      )}
    </Wrapper>
  );
};

export default DetailedInfoCard;
