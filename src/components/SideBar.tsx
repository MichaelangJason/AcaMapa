import { Course } from "@/types/course"
import { debounce, searchCourses } from "@/utils/requests"
import { useEffect, useState, useCallback } from "react"
import Image  from "next/image"
import "@/styles/sidebar.scss"
import { CourseResult } from "./Course/CourseResult"

const Search = () => {
  const [input, setInput] = useState('')
  const [results, setResults] = useState<Course[]>([])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debounceSearch = useCallback(
    debounce(searchCourses, 500),
    [] // empty deps array since searchCourses is stable
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  useEffect(() => {
    if (!input) {
      setResults([]);
      return;
    }
    debounceSearch(input).then((courses) => {
      setResults(courses);
    });
  }, [input, debounceSearch])

  return (
    <>
      <div className="search-bar">
        <input type="text" value={input} onChange={handleInputChange} />
        <Image 
          src="/search.svg" 
          alt="search" 
          width={20} 
          height={20} 
          className="search-icon"
        />
      </div>
      {/* <div>{JSON.stringify(results)}</div> */}
      <div className="course-result-container">
        {results.map(course => <CourseResult key={course.id} {...course} />)}
      </div>
    </>
  )
}

const SideBar = () => {
  return (
    <div className="sidebar">
        <Search />
    </div>
  )
}

export default SideBar