import { Course, CourseCode } from "@/types/course"
import { debounce } from "@/utils/requests"
import { useEffect, useState, useCallback, useMemo } from "react"
import Image  from "next/image"
import { CourseResult } from "./Course/CourseResult"
import React from "react"
import { toast } from "react-toastify"
import FlexSearch from "flexsearch"
import "@/styles/sidebar.scss"
import { useDispatch, useSelector } from "react-redux"
import { RootState } from "@/store"
import CourseTag from "./Course/CourseTag"
import { CourseTagType } from "@/utils/enums"
import { setAddingCourseId, setInitCourses, setSearchInput } from "@/store/globalSlice"
import { processQuery } from "@/utils"
const CourseTagGroup = (props: { courseTaken: CourseCode[], prefix: string }) => {
  const { courseTaken, prefix } = props;

  return (
    <div className="course-taken-group">
      <div className="course-taken-group-header">
        {prefix}
      </div>
      <div className="course-taken-group-body">
        {courseTaken.map(course => 
          <CourseTag 
          key={course} 
          courseId={course} 
          type={CourseTagType.TAKEN} 
          itExists={true}
          isMoving={false} 
          />
        )}
      </div>
    </div>
  )
}

const SideBar = () => {
  const input = useSelector((state: RootState) => state.global.searchInput);
  const courses = useSelector((state: RootState) => state.global.initCourses);
  const [isLoading, setIsLoading] = useState(true)
  const [results, setResults] = useState<Course[]>([])
  const [expanded, setExpanded] = useState(false)
  const dispatch = useDispatch()
  const courseTaken = useSelector((state: RootState) => state.courseTaken);
  const addingCourseId = useSelector((state: RootState) => state.global.addingCourseId);
  const [page, setPage] = useState(1);
  
  // flexsearch
  const index = useMemo(() => {
    const index = new FlexSearch.Document<Course>({
      // tokenize: 'full',
      document: {
        id: 'id',
        index: [
          { 
            field: 'id',
            tokenize: 'reverse',
            resolution: 9,
            encode: (str: string) => {
              const exact = str.toLowerCase();
              const noSpace = str.toLowerCase().replace(/\s+/g, '');
              return [exact, noSpace];
            }
          },
          { 
            field: 'name',
            tokenize: 'reverse',
            resolution: 9,
            encode: (str: string) => {
              const exact = str.toLowerCase();
              const noSpace = str.toLowerCase().replace(/\s+/g, '');
              return [exact, noSpace];
            }
          }
        ],
        // @ts-ignore, some typing error happened here
        store: ['id', 'name', 'credits']
      }
    })
    
    courses.forEach(course => {
      index.add(course)
    })
    return index
  }, [courses])

  // filter course taken
  const nonEmptyCourseTaken = Object.keys(courseTaken).filter(prefix => courseTaken[prefix].length > 0);

  const getCourses = async () => {      
    const response = await fetch('/api/courses')
    if (!response.ok) {
        throw new Error('Failed to fetch courses')
      }
  
    return (await response.json()) as Course[]
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce(async (input: string) => {
      setPage(1) // reset page
      const query = index.search(input, {
        enrich: true,
      })

      const result = processQuery(query);
      return result;
    }, 100),
    [index]
  );

  // search icon callback
  const handleSearch = async (e: any) => {
    if (!input) {
      setResults([]);
      return;
    }
    if (e.key && e.key !== "Enter") {
      return;
    }
    e.preventDefault();

    try {
      const query = index.search(input, { enrich: true });
      const results = processQuery(query);
      setResults(results);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
      setResults([]);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (addingCourseId) {
      dispatch(setAddingCourseId(null));
    }
    dispatch(setSearchInput(e.target.value)); // need it for seeking
  }

  // input
  useEffect(() => {
    if (!input) {
      setResults([]);
      return;
    }
    debouncedSearch(input)
      .then((courses) => {
        setResults(courses);
      });
  }, [input, debouncedSearch])

  // initializes the search results
  useEffect(() => {
    const fetchCourses = async () => {
      const courses = await toast.promise(
        getCourses(), 
        {
          pending: 'Initializing...',
          success: 'Initialization complete',
          error: 'Failed to initialize'
        }
      )
      console.log('Courses size:', JSON.stringify(courses).length / 1024, 'KB');
      console.log("courses fetched")
      dispatch(setInitCourses(courses || []))
      setIsLoading(false)
    }
    fetchCourses()
  }, [])

  return (
    <div className="sidebar" id="sidebar">
      <div className="search-bar">
        <input 
          type="text" 
          value={input} 
          onChange={handleInputChange} 
          onKeyDown={handleSearch} 
          placeholder="course code or name"
          disabled={isLoading}
        />
        <Image 
          src="/search.svg" 
          alt="search" 
          width={20} 
          height={20} 
          className="search-icon"
          onClick={handleSearch}
        />
      </div>
      <div className="result-container">
        {results.slice((page - 1) * 10, page * 10).map(course => <CourseResult key={course.id} {...course} partialMatch={input} />)}
      </div>
      <div className="course-taken-container">
        <div 
          className="course-taken-header"
          onClick={() => setExpanded(!expanded)}
        > 
          <b>Courses Taken</b>
          <div 
            className={`expand-button ${expanded ? 'expanded' : ''}`}
            onClick={() => setExpanded(!expanded)}
          >
            <Image src="/expand-single.svg" alt="expand" width={15} height={15} />
        </div>
        </div>
        {expanded 
          ? nonEmptyCourseTaken.length > 0
            ? <div className="course-taken-list">
                {nonEmptyCourseTaken.map((prefix, index) => (
                  <CourseTagGroup 
                    key={index} 
                    courseTaken={courseTaken[prefix]} 
                    prefix={prefix}
                  />
                ))}
              </div>
            : <div className="course-taken-empty">
                no courses taken
              </div>
          : null}
      </div>
    </div>
  )
}

export default SideBar