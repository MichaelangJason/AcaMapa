export function formatCourseId(id: string, separator = " ", isLower = false) {
  const formatted = (id.slice(0, 4) + separator + id.slice(4)).toUpperCase();
  return isLower ? formatted.toLowerCase() : formatted;
}

export function formatLevelStr(scopes: string) {
  if (scopes[0] === "0") return "=ANY";

  return scopes.length > 1 ? `>=${scopes[0]}XX` : `=${scopes[0]}XX`;
}

export function joinWithBreaks(strings: string[], itemPerRow = 3): string {
  return strings.reduce((result, str, index) => {
    result += str;
    if ((index + 1) % itemPerRow === 0 && index !== strings.length - 1) {
      result += /* html */ `<br/>`;
    } else if (index !== strings.length - 1) {
      result += ", ";
    }
    return result;
  }, "");
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

export function getComputedStyleValueByClassName(
  className: string,
  key: string,
) {
  const element = document.querySelector(`.${className}`);
  if (!element) return undefined;
  return getComputedStyle(element).getPropertyValue(key);
}

export function getCommandKey() {
  if (navigator.userAgent.includes("Mac")) {
    return "⌘";
  }
  return "Ctrl";
}

export function checkObjectKeys(obj: object, keys: string[]) {
  return (
    typeof obj === "object" && obj !== null && keys.every((key) => key in obj)
  );
}

export function deepClone<T>(value: T): T {
  // primitive types
  if (
    value === undefined ||
    value === null ||
    typeof value === "boolean" ||
    typeof value === "string" ||
    typeof value === "number"
  )
    return value;

  // arrays
  if (Array.isArray(value)) {
    return Array.from(value, (v) => deepClone(v)) as T;
  }

  // objects
  const cloned = Object.create(Object.getPrototypeOf(value));
  Object.entries(value).forEach(
    ([key, value]) => (cloned[key] = deepClone(value)),
  );

  return cloned;
}
