export const formatCourseId = (
  id: string,
  separator = " ",
  isLower = false,
) => {
  const formatted = (id.slice(0, 4) + separator + id.slice(4)).toUpperCase();
  return isLower ? formatted.toLowerCase() : formatted;
};

export const clamp = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(value, max));
};

export const getComputedStyleValueByClassName = (
  className: string,
  key: string,
) => {
  const element = document.querySelector(`.${className}`);
  if (!element) return undefined;
  return getComputedStyle(element).getPropertyValue(key);
};

export const getCommandKey = () => {
  if (navigator.userAgent.includes("Mac")) {
    return "⌘";
  }
  return "Ctrl";
};

export const checkObjectKeys = (obj: object, keys: string[]) => {
  return (
    typeof obj === "object" && obj !== null && keys.every((key) => key in obj)
  );
};
