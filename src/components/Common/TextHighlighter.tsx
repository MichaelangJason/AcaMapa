import { ReactNode } from "react";

const TextHighlighter = ({
  source,
  target,
}: {
  source: string;
  target?: string;
}) => {
  if (!target || !source) return <>{source}</>;

  const normalizedSource = source.toLowerCase().replace(/\s+/g, "");
  const normalizedTarget = target.toLowerCase().replace(/\s+/g, "");

  const escapeRegex = (string: string) => {
    const specialChars = /[.*+?^${}()|[\]\\]/g;
    return string.replace(specialChars, "\\$&");
  };

  const pattern = new RegExp(escapeRegex(normalizedTarget), "gi");

  const matches: number[] = [];
  let match;
  while ((match = pattern.exec(normalizedSource)) !== null) {
    matches.push(match.index);
  }

  if (matches.length === 0) return <>{source}</>;

  const originalPositions: Array<[number, number]> = [];
  let normalizedIndex = 0; // Keep track of where we are in normalized string
  let originalIndex = 0; // Keep track of where we are in original string

  for (const matchIndex of matches) {
    // Move to the start of the current match
    while (normalizedIndex < matchIndex) {
      if (source[originalIndex].toLowerCase() !== " ") {
        normalizedIndex++;
      }
      originalIndex++;
    }
    // Skip any remaining spaces
    while (source[originalIndex] === " ") {
      originalIndex++;
    }

    const matchStart = originalIndex;
    let matchLength = 0;

    // Find the end of the current match
    while (matchLength < normalizedTarget.length) {
      if (source[originalIndex].toLowerCase() !== " ") {
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
    result.push(<mark className="highlight-text">{match}</mark>);
    lastPos = end;
  });

  const after = source.slice(lastPos);
  if (after) result.push(after);

  return (
    <>
      {result.map((r, index) => (
        <span key={index}>{r}</span>
      ))}
    </>
  );
};

export default TextHighlighter;
