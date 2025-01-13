import { Course, CourseCode } from "@/types/course"
import { debounce } from "@/utils/requests"
import { useEffect, useState, useCallback, useMemo } from "react"
import Image  from "next/image"
import { CourseResult } from "./Course/CourseResult"
import React from "react"
import { toast } from "react-toastify"
import Fuse from "fuse.js"
import "@/styles/sidebar.scss"
import { useSelector } from "react-redux"
import { RootState } from "@/store"
import CourseTag from "./Course/CourseTag"
import { CourseTagType } from "@/utils/enums"

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
  const [input, setInput] = useState('')
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [results, setResults] = useState<Course[]>([])
  const [expanded, setExpanded] = useState(false)
  const courseTaken = useSelector((state: RootState) => state.courseTaken);
  
  // fuse search
  const fuse = useMemo(() => 
    new Fuse(
      courses, 
      { 
        keys: [
          { name: 'id', weight: 2 },
          { name: 'name', weight: 1 }
        ],
        threshold: 0.1,
        shouldSort: true
      }
    ), 
    [courses]
  )

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
  const debounceFuseSearch = useCallback(
    debounce(async (input: string) => {
      let results = fuse.search(input)
      if (results.length === 0 && input.length > 4) {
        results = fuse.search(input.slice(0, 4) + " " + input.slice(4))
      }
      results = results.slice(0, 10)

      return results.map(result => result.item);
    }, 100),
    [fuse]
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
      const results = fuse.search(input);
      setResults(results.map(result => result.item));
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
      setResults([]);
    }
  }

  // input
  useEffect(() => {
    if (!input) {
      setResults([]);
      return;
    }
    debounceFuseSearch(input).then((courses) => {
      setResults(courses);
    });
  }, [input, debounceFuseSearch])

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
      setCourses(courses || [])
      setIsLoading(false)
    }
    fetchCourses()
  }, [])

  return (
    <div className="sidebar">
      <div className="search-bar">
        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
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
        {results.map(course => <CourseResult key={course.id} {...course} />)}
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