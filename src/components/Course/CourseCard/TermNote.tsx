"use client";

import type { TooltipProps } from "@/types/local";
import clsx from "clsx";
import WinterIcon from "@/public/icons/winter.svg";
import SummerIcon from "@/public/icons/summer.svg";
import FallIcon from "@/public/icons/fall.svg";
import NotOfferedIcon from "@/public/icons/not-offered.svg";
import { Season } from "@/lib/enums";

const mapSeason = (term: string) => {
  const season = term.match(/[A-Za-z ]+/)?.[0].trim();

  if (!season) {
    return <NotOfferedIcon />;
  }

  const seasonIcon = {
    w: <WinterIcon />,
    s: <SummerIcon />,
    f: <FallIcon />,
    n: <NotOfferedIcon />,
  }[season[0].toLowerCase()];

  return (
    <>
      {seasonIcon}
      {season}
    </>
  );
};

const TermNote = ({
  termSeason,
  terms,
  className,
}: {
  terms: string[];
  termSeason: Season;
  tooltipOptions?: TooltipProps;
  className?: string;
}) => {
  return (
    <div
      className={clsx("term-note", className)}
      style={
        {
          "--columns": terms.length,
        } as React.CSSProperties
      }
    >
      {terms.map((term) => (
        <span
          key={term}
          className={clsx(
            "season",
            term.toLowerCase().includes(termSeason.toLowerCase()) && "matched",
          )}
        >
          {mapSeason(term)}
        </span>
      ))}
    </div>
  );
};

export default TermNote;
