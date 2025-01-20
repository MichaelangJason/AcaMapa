import { debounce } from "@/utils/requests"
import { useEffect, useState, useCallback, useMemo, useRef, ChangeEvent } from "react"
import Image  from "next/image"
import { CourseResult } from "@/components/Course"
import { toast } from "react-toastify"
import FlexSearch from "flexsearch"
import "@/styles/sidebar.scss"
import { useDispatch, useSelector } from "react-redux"
import { RootState } from "@/store"
import { setAddingCourseId, setIsSideBarExpanded, setSearchInput } from "@/store/slices/globalSlice"
import { processQuery } from "@/utils"
import CourseTaken from "./CourseTaken"
import { IRawCourse } from "@/db/schema"
import { CourseResultSkeleton } from "@/components/Skeleton"
import { Constants } from "@/utils/enums"

const SideBar = () => {
  const dispatch = useDispatch() // for redux state manipulations
  const input = useSelector((state: RootState) => state.global.searchInput); // search input
  const courses = useSelector((state: RootState) => state.global.initCourses); // TODO switch to api call?
  const isInitialized = useSelector((state: RootState) => state.global.isInitialized); // initial loading state
  const [results, setResults] = useState<IRawCourse[]>(courses) // search results
  const addingCourseId = useSelector((state: RootState) => state.global.addingCourseId); // for highlighting purpose
  const isSideBarExpanded = useSelector((state: RootState) => state.global.isSideBarExpanded);
  /* infinite scroll*/
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const resultContainerRef = useRef<HTMLDivElement>(null);

  // TODO: switch to server based api call for better search?
  const index = useMemo(() => {
    const index = new FlexSearch.Document<IRawCourse>({
      // tokenize: 'full',
      document: {
        id: 'id',
        index: [
          { 
            field: 'id',
            tokenize: 'full',
            resolution: 9,
            encode: (str: string) => {
              const exact = str.toLowerCase();
              const noSpace = str.toLowerCase().replace(/\s+/g, '');
              return [exact, noSpace];
            }
          },
          { 
            field: 'name',
            tokenize: 'full',
            resolution: 9,
            // encode: (str: string) => {
            //   const exact = str.toLowerCase();
            //   const noSpace = str.toLowerCase().replace(/\s+/g, '');
            //   return [exact, noSpace];
            // }
          }
        ],
        // @ts-expect-error, some ignorable typing error happened here
        store: ['id', 'name', 'credits']
      }
    })
    
    courses.forEach(course => {
      index.add(course)
    })
    return index
  }, [courses])

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
      setResults(courses);
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
      setResults(courses);
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (addingCourseId) {
      dispatch(setAddingCourseId(null));
    }
    dispatch(setSearchInput(e.target.value)); // need it for seeking
  }

  const handleSideBarToggle = () => {
    dispatch(setIsSideBarExpanded(!isSideBarExpanded));
  }

  // trigger search from input change
  useEffect(() => {
    if (!input) {
      setResults(courses);
      return;
    }
    debouncedSearch(input)
      .then((courses) => {
        setResults(courses);
      });
  }, [input, debouncedSearch, courses])

  // Simplified intersection observer setup
  useEffect(() => {
    if (!resultContainerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.5 }
    );

    const loadingTrigger = document.getElementById('loading-trigger');
    if (loadingTrigger) {
      observer.observe(loadingTrigger);
    }

    return () => {
      observer.disconnect();
    };
  }, [hasMore]);

  // Update hasMore when results change
  useEffect(() => {
    setHasMore(page * 10 < results.length);
  }, [results, page]);

  return (
    <>
      <div className={`sidebar-toggle ${isSideBarExpanded ? '' : 'folded'}`} onClick={handleSideBarToggle}>
        <Image 
          src="/expand.svg" 
          alt="sidebar-toggle" 
          width={10} 
          height={10}
          className={(isSideBarExpanded ? '' : 'icon-folded')} 
        />
      </div>
      <div className={`sidebar ${isSideBarExpanded ? '' : 'folded'}`} id="sidebar">
        <div className="sidebar-header">
          <Image src="/mcgill-logo.png" alt="logo" width={210} height={50} priority={true}/>
        </div>
        <div className="search-bar">
          <input 
            id="search-input"
            type="text" 
            value={input} 
            onChange={handleInputChange} 
            onKeyDown={handleSearch} 
            placeholder="course code or name"
            disabled={!isInitialized}
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
        <div className={`result-container ${isInitialized ? '' : 'initializing'}`} ref={resultContainerRef}>
          {isInitialized 
            ? results.slice(0, page * 10).map(course => 
                <CourseResult 
                  key={course.id} 
                  {...course} 
                  partialMatch={input} 
                />
              )
            : Array(Constants.MOCK_RESULT_N).fill(null).map((_, idx) => <CourseResultSkeleton key={"mock"+idx}/>)}
          <div id="loading-trigger" />
          {isInitialized && results.length > 0 && hasMore && <div className="loading">Loading more...</div>}
        </div>
        <CourseTaken />
      </div>
    </>
  )
}

export default SideBar