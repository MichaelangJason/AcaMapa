import { MAX_COURSE_IDS_TO_DISPLAY } from "@/lib/constants";
import { type Language, t, I18nKey } from "@/lib/i18n";
import { isValidDetailedCourse } from "@/lib/typeGuards";
import { formatCourseId } from "@/lib/utils";
import { fetchCourseData } from "@/store/thunks";
import { isAnyOf } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { startListening } from "./core";

startListening({
  matcher: isAnyOf(
    fetchCourseData.fulfilled,
    fetchCourseData.rejected,
    fetchCourseData.pending,
  ),
  effect: (action, listenerApi) => {
    const lang = listenerApi.getState().userData.lang as Language;
    const isToastEnabled = listenerApi.getState().global.isToastEnabled;

    if (!isToastEnabled) return;
    const payload = action.payload;

    switch (action.type) {
      case fetchCourseData.fulfilled.type: {
        if (
          !Array.isArray(payload) ||
          !payload.every((item) => isValidDetailedCourse(item))
        ) {
          toast.error(
            t([I18nKey.FAILED_TO_FETCH], lang, {
              item1: t([I18nKey.COURSE_DATA], lang),
            }),
          );
          break;
        }
        const courseIds = payload.map((item) => formatCourseId(item.id));
        toast.success(() => {
          return (
            <div>
              <strong>
                {courseIds
                  .slice(0, MAX_COURSE_IDS_TO_DISPLAY)
                  .flatMap((id, idx) =>
                    idx === 0
                      ? [<span key={id}>{formatCourseId(id)}</span>]
                      : [
                          <br key={`${id}-br`} />,
                          <span key={id}>{formatCourseId(id)}</span>,
                        ],
                  )}
                {courseIds.length > MAX_COURSE_IDS_TO_DISPLAY && (
                  <>
                    <br />
                    <span>
                      + {courseIds.length - MAX_COURSE_IDS_TO_DISPLAY}{" "}
                      {t([I18nKey.MORE], lang).toLowerCase()}
                    </span>
                  </>
                )}
              </strong>
              <br />
              <span>{t([I18nKey.FETCHED_M], lang)}</span>
            </div>
          );
        });
        break;
      }
      case fetchCourseData.rejected.type: {
        toast.error(
          t([I18nKey.FAILED_TO_FETCH], lang, {
            item1: t([I18nKey.COURSE_DATA], lang),
          }),
        );
        break;
      }
      default:
        break;
    }
  },
});
