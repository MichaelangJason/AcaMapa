import { Tag } from "@/components/Common";
import { TooltipId } from "@/lib/enums";
import { t, I18nKey, type Language } from "@/lib/i18n";
import { formatCourseId } from "@/lib/utils";

const Subject = ({
  subjectCode,
  courseIds,
  handleRemoveCourseTaken,
  lang,
}: {
  subjectCode: string;
  courseIds: string[];
  handleRemoveCourseTaken: (
    e: React.MouseEvent<HTMLSpanElement>,
    source?: string,
  ) => void;
  lang: Language;
}) => {
  return (
    // group by subject code
    <div className="course-taken-item">
      <h5 className="subject">{subjectCode.toUpperCase()}</h5>
      <div className="ids">
        {courseIds.map((id) => {
          // course ids for each subject code
          return (
            <Tag
              key={`${subjectCode}-${id}`}
              id={`course-taken-${id}`}
              sourceText={id}
              displayText={formatCourseId(id)}
              callback={handleRemoveCourseTaken}
              className="clickable"
              tooltipOptions={{
                "data-tooltip-id": TooltipId.COURSE_TAKEN,
                "data-tooltip-content": t(
                  [I18nKey.REMOVE, I18nKey.OR, I18nKey.ADD_TO_SELECTED],
                  lang,
                ),
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Subject;
