import { Course, CourseCode, IGroup } from "@/types/course";
import { TermId } from "@/types/term";
import { memo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import CourseTag from "./CourseTag";
import { CourseTagType, GroupType, ReqTitle } from "@/utils/enums";
import "@/styles/course.scss"
import { findCourseIds, parseGroup } from "@/utils";

interface PreCoReqProps {
  parsed: string;
  raw: string;
  termId: TermId;
  title: string;
  isMoving: boolean;
}

const ReqGroup = (props: { group: IGroup, termId: TermId, isPresent: Map<CourseCode, boolean>, isMoving: boolean }) => {
  const { group, termId, isPresent, isMoving } = props;

  const AndOrGroup = (props: { group: IGroup, elemGap: number, direction: 'row' | 'column'}) => {
    const { group, elemGap, direction } = props;
    const groupType = group.type;
    const gap = groupType === GroupType.AND 
      ? elemGap 
      : groupType === GroupType.OR && direction === 'row'
        ? elemGap
        : 0;
    return (
      <div className="prereq-group" style={{gap, flexDirection: direction}}>
        {group.inner.flatMap((item, index) => {
          const elem = typeof item === 'string' 
            ? <CourseTag 
                courseId={item} 
                type={CourseTagType.REQUIRED} 
                itExists={isPresent.get(item) || false} 
                key={`${item}-${index}`} 
                isMoving={isMoving} 
              />
            : <InnerGroup 
                group={item} 
                elemGap={elemGap - 1} 
                direction={direction === 'row' ? 'column' : 'row'} 
                key={`group-${index}`}
              />
          return [
            <div key={`elem-${index}`}>{elem}</div>,
            index < group.inner.length - 1 
              ? <div 
                  key={`divider-${index}`} 
                  className={groupType === GroupType.AND ? "prereq-and" : "prereq-or"}
                >
                  {groupType === GroupType.AND ? "AND" : "OR"}
                </div>
              : null
          ]
        })}
      </div>
    )
  }

  const PairGroup = (props: { group: IGroup, elemGap: number, direction: 'row' | 'column'}) => {
    const { group, elemGap, direction } = props;
    return (
      <div className="prereq-group" style={{gap: elemGap, flexDirection: direction}}>
        <div className="prereq-pair">TWO FROM:</div>
        {(group.inner as string[]).map((id, index) => (
          <CourseTag 
            courseId={id} 
            type={CourseTagType.REQUIRED} 
            itExists={isPresent.get(id) || false} 
            key={`pair-${index}`} 
            isMoving={isMoving} 
            disabled={true}
          />
        ))}
      </div>
    )
  }

  const CreditGroup = (props: { group: IGroup, elemGap: number, direction: 'row' | 'column'}) => {
    const { group } = props;
    const [required, scopes, ...prefixes] = group.inner as string[];
    const levels = scopes.split("").map(l => parseInt(l));
    const context = useSelector((state: RootState) => {
        // overhead considered, these are rare cases
        const courseTaken = Object.values(state.courseTaken)
          .flat()
          .map(id => state.global.initCourses.find(course => course.id === id))
          .filter(course => course !== undefined);
      
        return state.terms.order
          .slice(0, state.terms.order.indexOf(termId))
          .flatMap(termId => state.terms.data[termId].courseIds)
          .map(id => state.courses[id])
          .concat(courseTaken as Course[]);
      });

    const creditMap = context.reduce((acc, course) => {
      const [prefix, code] = course.id.split(' ');
      const level = parseInt(code[0]);
      if (levels[0] === 0 || levels.includes(level)) {
        acc[prefix] = (acc[prefix] || 0) + course.credits;
      }
      return acc;
    }, {} as Record<string, number>);

    prefixes.forEach(prefix => {
      if (creditMap[prefix] === undefined) {
        creditMap[prefix] = 0;
      }
    })

    const levelString = levels[0] === 0 
      ? '-ANY'
      : levels.length > 1
        ? '>=' + levels[0] + 'XX'
        : '-' + levels[0] + 'XX';

    const totalCredits = Object.values(creditMap).reduce((acc, curr) => acc + curr, 0);
    const requiredCredits = parseInt(required) || 3;
    
    return (
      <div className="prereq-group" style={{gap: 0, flexDirection: 'column'}}>
        <div className="prereq-credits">AT LEAST <b>{required}</b> CREDITS FROM:</div>
        {prefixes.flatMap((prefix, index) => [
          <CourseTag 
            courseId={prefix + levelString + '(' + creditMap[prefix] + ')'} 
            type={CourseTagType.REQUIRED} 
            itExists={creditMap[prefix] >= requiredCredits || totalCredits >= requiredCredits} 
            key={`credit-${index}`} 
            isMoving={isMoving} 
            disabled={true}
          />,
          index < prefixes.length - 1 && <div className="prereq-or">OR</div>
        ])}
      </div>
    )
  }

  const InnerGroup = (props: { group: IGroup, elemGap: number, direction: 'row' | 'column'}) => {
    const { group, elemGap, direction } = props;

    const groupType = group.type;
    switch (groupType) {
      case GroupType.AND:
      case GroupType.OR:
      case GroupType.SINGLE:
        return <AndOrGroup group={group} elemGap={elemGap} direction={direction} />
      case GroupType.CREDIT:
        return <CreditGroup group={group} elemGap={elemGap} direction={direction} />
      case GroupType.PAIR:
        return <PairGroup group={group} elemGap={elemGap} direction={direction} />
      case GroupType.EMPTY:
        return null;
      default:
        throw new Error("Invalid group type: " + groupType);
    }
  }


  return (
    <InnerGroup group={group} elemGap={5} direction={"row"} />
  )
}


const PreCoReq = (props: PreCoReqProps) => {
  const { parsed, raw, termId, isMoving, title } = props;
  const terms = useSelector((state: RootState) => state.terms);
  const parsedGroup = parseGroup(parsed);

  const thisTermCourseIds = terms.data[termId].courseIds;
  const prevTermCourseIds = terms.order
    .slice(0, terms.order.indexOf(termId))
    .flatMap(termId => terms.data[termId].courseIds);
  const courseTaken = useSelector((state: RootState) => state.courseTaken);
  const allCourseIds = findCourseIds(parsed, true);

  const isPresent = title === ReqTitle.CO_REQ
    ? new Map(allCourseIds.map(id => [
      id,
      thisTermCourseIds.includes(id) || 
      prevTermCourseIds.includes(id) || 
      courseTaken[id.split(' ')[0]]?.includes(id)
    ]))
    : new Map(allCourseIds.map(id => [
      id,
      prevTermCourseIds.includes(id) || 
      courseTaken[id.split(' ')[0]]?.includes(id)
    ]))
  
  return (
    <div className="course-req-notes-container">
      <div className="title">{title}</div>
      {parsedGroup.type !== GroupType.EMPTY && (
        <div className="prereq-container">
          <ReqGroup group={parsedGroup} termId={termId} isPresent={isPresent} isMoving={isMoving} />
        </div>
      )}

      <ul className="notes">
        {raw.split("\n").map((note, idx) => <li key={idx}>{note}</li>)}
      </ul>
    </div>
  )
}

export default memo(PreCoReq);