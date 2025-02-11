import { setAddingCourseId, setIsSideBarExpanded, setSeekingInfo, toggleCourseTakenExpanded, toggleUtilityDropdownMenuOpen, toggleSideBarExpanded } from "@/store/slices/globalSlice";
import { useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { addTerm } from "@/store/slices/termSlice";
import { addPlan } from "@/store/slices/planSlice";


const KeyPressListener = () => {
  const dispatch = useDispatch();

  const focusInput = () => {
    const input = document.getElementById("search-input");
    if (input) {
      input.focus();
    }
  }

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.defaultPrevented) {
      return;
    }

    const key = event.key?.toLowerCase();

    if (key === "escape") {
      dispatch(setAddingCourseId(null));
      dispatch(setSeekingInfo({ }));
    }

    if (event.metaKey || event.ctrlKey) {
      if (key === "b") { // toggle sidebar
        event.preventDefault();
        dispatch(toggleSideBarExpanded());
      } else if (key === 'n') { // add term
        event.preventDefault();
        dispatch(addTerm());
        // Scroll to rightmost after adding term
        setTimeout(() => {
          const body = document.documentElement;
          const scrollWidth = Math.max(
            body.scrollWidth - window.innerWidth,
            0
          );
          window.scrollTo({
            left: scrollWidth,
            behavior: 'smooth'
          });
        }, 50);
      } else if (key === 'k') { // search course
        event.preventDefault();
        dispatch(setIsSideBarExpanded(true));
        focusInput();
      } else if (key === 'l') { // toggle course taken
        event.preventDefault();
        dispatch(toggleCourseTakenExpanded());
      } else if (key === 'p') { // add plan
        event.preventDefault();
        dispatch(addPlan());
      } else if (key === 'm') { // toggle dropdown menu
        event.preventDefault();
        dispatch(toggleUtilityDropdownMenuOpen());
      }
    }
  }, [dispatch]);

  useEffect(() => {
    window.removeEventListener("keydown", handleKeyDown);
    window.addEventListener("keydown", handleKeyDown);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return null;
}

export default KeyPressListener;