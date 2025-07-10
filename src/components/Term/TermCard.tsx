"use client";

import type { Term } from "@/types/db";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import HamburgerIcon from "@/public/hamburger.svg";
import PlusIcon from "@/public/icons/plus.svg";
import { DraggingType } from "@/lib/enums";
import clsx from "clsx";
import { getComputedStyleValueByClassName } from "@/lib/utils";
import { useState } from "react";

const AddTermButton = ({
  isBefore,
  onClick,
}: {
  isBefore: boolean;
  onClick: (isBefore: boolean) => void;
}) => {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    onClick(isBefore);
    setTimeout(() => {
      setIsClicked(false);
    }, 100);
  };
  return (
    <button
      className={clsx([
        "add-term-button",
        isBefore && "on-left",
        isClicked && "clicked",
      ])}
      onClick={handleClick}
    >
      <PlusIcon />
    </button>
  );
};

const TermCard = ({
  term,
  isFirst,
  addTerm,
  deleteTerm,
  style,
  isDraggingOverlay,
}: {
  term: Term;
  isFirst: boolean;
  addTerm: (termId: string, isBefore?: boolean) => void;
  deleteTerm: (termId: string) => void;
  style?: React.CSSProperties;
  isDraggingOverlay?: boolean;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transition,
    transform,
    isDragging: isDraggingSelf,
  } = useSortable({
    id: term._id.toString(),
    data: {
      type: DraggingType.TERM,
    },
  });

  const handleClickButton = (isBefore: boolean) => {
    addTerm(term._id.toString(), isBefore);
  };

  const allStyle = {
    ...style,
    transition,
    transform: CSS.Transform.toString(transform),
    height: isDraggingOverlay
      ? getComputedStyleValueByClassName("term-card", "height")
      : undefined,
  };

  return (
    <div
      className={clsx(["term-card", isDraggingSelf && "dragging"])}
      ref={setNodeRef}
      style={allStyle}
    >
      {isFirst && <AddTermButton isBefore={true} onClick={handleClickButton} />}
      <header className="term-header" {...attributes} {...listeners}>
        <span>{term.name}</span>
        <HamburgerIcon onClick={() => deleteTerm(term._id.toString())} />
      </header>
      <main className="term-body"></main>
      <footer className="term-footer"></footer>

      <AddTermButton isBefore={false} onClick={handleClickButton} />
    </div>
  );
};

export default TermCard;
