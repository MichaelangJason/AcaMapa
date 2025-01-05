import { CourseCode } from "@/types/course";
import { TermMap } from "@/types/term";
import { TermId } from "@/types/term";

export const isSatisfied = (
  {prerequisites, antirequisites, corequisites, courseTaken, terms, termId}: {
    prerequisites?: CourseCode[][],
    antirequisites?: CourseCode[],
    corequisites?: CourseCode[][],
    courseTaken: CourseCode[],
    terms: {
      data: TermMap;
      order: TermId[];
      inTermCourseIds: CourseCode[];
    },
    termId: string
  }
) => {
  const { order } = terms;
  const thisTermIdx = order.indexOf(termId);
  const thisTermCourseIds = terms.data[termId].courseIds;
  const prevTermCourseIds = order
    .slice(0, thisTermIdx)
    .flatMap(termId => terms.data[termId].courseIds)
    .concat(courseTaken);

  const prereqSatisfied = !prerequisites || prerequisites.every(group => 
    // every group must have at least one course from the previous term
    group.some(id => prevTermCourseIds.includes(id))
  );

  const antireqSatisfied = !antirequisites || antirequisites.every(
    // every antirequisite must be from the previous term or this term
    id => !prevTermCourseIds.includes(id) && !thisTermCourseIds.includes(id)
  );

  const coreqSatisfied = !corequisites || corequisites.every(group => 
    // every corequisite must be from the previous term or this term
    group.some(id => prevTermCourseIds.includes(id) || thisTermCourseIds.includes(id))
  );

  return prereqSatisfied && antireqSatisfied && coreqSatisfied;
}

export const splitCourseIds = (val: string[]) => {
  const pattern = /^[a-zA-Z]{4} \d{3}([djnDJN][1-3])?$/;
  
  const { courseIds, notes } = val.reduce((acc, val) => {
    if (pattern.test(val)) {  
      acc.courseIds.push(val);
    } else {
      acc.notes.push(val);
    }
    return acc;
  }, {courseIds: [] as CourseCode[], notes: [] as string[]});

  return {courseIds, notes};
}