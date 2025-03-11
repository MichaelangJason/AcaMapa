import { RootState } from "@/store";
import { setAddingCourseId } from "@/store/slices/globalSlice";
import "@/styles/course.scss"
import { useDispatch, useSelector } from "react-redux";
import Image from "next/image";
import { ReactNode } from "react";

export interface CourseResultProps {
  id: string;
  name: string;
  credits: number;
  cb?: () => void;
  partialMatch?: string;
}

const markPartialMatch = (source: string, target: string | undefined) => {
  if (!target || !source) return <>{source}</>;

  const normalizedSource = source.toLowerCase().replace(/\s+/g, '');
  const normalizedTarget = target.toLowerCase().replace(/\s+/g, '');
  
  const escapeRegex = (string: string) => {
    const specialChars = /[.*+?^${}()|[\]\\]/g;
    return string.replace(specialChars, '\\$&');
  }
  
  const pattern = new RegExp(escapeRegex(normalizedTarget), 'gi');
  
  const matches: number[] = [];
  let match;
  while ((match = pattern.exec(normalizedSource)) !== null) {
    matches.push(match.index);
  }

  if (matches.length === 0) return <>{source}</>;

  const originalPositions: Array<[number, number]> = [];
  let normalizedIndex = 0;  // Keep track of where we are in normalized string
  let originalIndex = 0;    // Keep track of where we are in original string
  
  for (const matchIndex of matches) {
    // Move to the start of the current match
    while (normalizedIndex < matchIndex) {
      if (source[originalIndex].toLowerCase() !== ' ') {
        normalizedIndex++;
      }
      originalIndex++;
    }
    // Skip any remaining spaces
    while (source[originalIndex] === ' ') {
        originalIndex++;
    }

    const matchStart = originalIndex;
    let matchLength = 0;
    
    // Find the end of the current match
    while (matchLength < normalizedTarget.length) {
      if (source[originalIndex].toLowerCase() !== ' ') {
        matchLength++;
      }
      originalIndex++;
    }

    originalPositions.push([matchStart, originalIndex]);
    normalizedIndex += normalizedTarget.length;
  }

  // Build result
  const result = [] as ReactNode[];
  let lastPos = 0;

  originalPositions.forEach(([start, end]) => {
    const before = source.slice(lastPos, start);
    const match = source.slice(start, end);

    if (before) result.push(before);
    result.push(<mark style={{backgroundColor: "var(--sidebar-result-hightlight-bg-color)"}}>{match}</mark>); 
    lastPos = end;
  });

  const after = source.slice(lastPos);
  if (after) result.push(after);
  
  return <>{result.map((r, index) => <span key={index}>{r}</span>)}</>;
}

const CourseResult = (props: CourseResultProps) => {
  const { id, name, credits, cb, partialMatch } = props;
  const dispatch = useDispatch();
  const addingCourseId = useSelector((state: RootState) => state.global.addingCourseId);

  const handleAddCourse = () => {
    if (cb) cb();
    dispatch(addingCourseId === id 
      ? setAddingCourseId(null) 
      : setAddingCourseId(id)
    );
  }

  const handleCourseClick = () => {
    // open course page in new tab
    const domain = process.env.NEXT_PUBLIC_SCHOOL_DOMAIN;
    const academicYear = process.env.NEXT_PUBLIC_ACADEMIC_YEAR;
    const endpoint = process.env.NEXT_PUBLIC_SCHOOL_ENDPOINT?.replace(/ACADEMIC_YEAR/i, academicYear || "");
    const courseId = id.replace(" ", "-").toLowerCase();
    window.open(`${domain}${endpoint}${courseId}`, "_blank");
  }

  const markedId = markPartialMatch(id, partialMatch);
  const markedName = markPartialMatch(name, partialMatch);

  const isNameEmpty = name === "isEmpty";

  return (
    <div className={`course-card-container result ${addingCourseId === id ? "selected" : ""}`}>
      <div className="course-card-info-basic">
        <div className="name">{isNameEmpty ? "No Name" : markedName}</div>
        <div 
          className="id-credits" 
          onClick={handleCourseClick}
          title="Go to course page"
        >
          <b>{markedId} </b> 
          <span className="credits">({credits > 0 ? credits : 0} credits)</span>
        </div>
      </div>
      <div className="course-button-container in-search">
          <Image 
            src="/cross.svg" 
            alt="Add Course" 
            width={15} 
            height={15} 
            onClick={handleAddCourse} 
            className="course-button"
          />
        </div>
    </div>
  );
};

export default CourseResult;