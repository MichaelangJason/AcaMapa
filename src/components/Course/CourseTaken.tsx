"use client";

import {
  toggleIsCourseTakenExpanded,
  setIsCourseTakenExpanded,
} from "@/store/slices/globalSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useCallback } from "react";
import ExpandIcon from "@/public/icons/expand-single.svg";
import { Tag } from "../Common";
import clsx from "clsx";
import { formatCourseId } from "@/lib/utils";
import {
  addCourseTaken,
  removeCourseTaken,
} from "@/store/slices/userDataSlice";
import { clearSelectedCourses } from "@/store/slices/localDataSlice";

const CourseTaken = () => {
  const dispatch = useAppDispatch();
  const isCourseTakenExpanded = useAppSelector(
    (state) => state.global.isCourseTakenExpanded,
  );
  const isAddingCourse = useAppSelector((state) => state.global.isAddingCourse);
  const selectedCourses = useAppSelector(
    (state) => state.localData.selectedCourses,
  );
  const courseTaken = useAppSelector((state) => state.userData.courseTaken);

  const handleExpand = useCallback(() => {
    dispatch(toggleIsCourseTakenExpanded());
  }, [dispatch]);
  const handleRemoveCourseTaken = useCallback(
    (source?: string) => {
      if (!source) return;
      dispatch(removeCourseTaken([source]));
    },
    [dispatch],
  );
  const handleAddCourseTaken = useCallback(() => {
    dispatch(
      addCourseTaken([...selectedCourses.values()].map((course) => course.id)),
    );
    dispatch(clearSelectedCourses());
    dispatch(setIsCourseTakenExpanded(true));
  }, [dispatch, selectedCourses]);

  return (
    <section
      className={clsx(["course-taken", isCourseTakenExpanded && "expanded"])}
    >
      <header onClick={handleExpand}>
        <h4 className="title">Course Taken</h4>
        <ExpandIcon className="expand" />
      </header>
      {isCourseTakenExpanded ? (
        <section className="course-taken-list scrollbar-custom scroll-mask">
          {courseTaken.size <= 0 ? (
            <span className="empty">empty</span>
          ) : (
            [...courseTaken.entries()].map(([subjectCode, courseIds], idx) => {
              return (
                <div key={idx} className="course-taken-item">
                  <h5 className="subject">{subjectCode.toUpperCase()}</h5>
                  <div className="ids">
                    {courseIds.map((id, idx) => {
                      return (
                        <Tag
                          key={idx}
                          source={id}
                          displayText={formatCourseId(id)}
                          callback={handleRemoveCourseTaken}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </section>
      ) : null}

      {isAddingCourse ? (
        <div className="adding-mask" onClick={handleAddCourseTaken}>
          Add to Course Taken
        </div>
      ) : null}
    </section>
  );
};

export default CourseTaken;
