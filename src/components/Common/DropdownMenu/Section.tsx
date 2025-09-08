"use client";
import * as DM from "@radix-ui/react-dropdown-menu";
import Item, { type ItemProps } from "./Item";
import SubSection, { type SubSectionProps } from "./SubSection";
import { useAppSelector } from "@/store/hooks";

const Section = ({
  label,
  items,
  handleCloseDropdownMenu,
}: {
  label?: string;
  items: (ItemProps | SubSectionProps)[];
  handleCloseDropdownMenu: () => void;
}) => {
  const isDragging = useAppSelector((state) => state.global.isDragging);

  return (
    <>
      {label && <DM.Label className="label">{label}</DM.Label>}

      <section className="dropdown-menu-section">
        {items.map((item, index) => {
          const id = item.self.id;
          return "items" in item ? (
            <SubSection
              key={`${index}-${id}`}
              {...item}
              handleCloseDropdownMenu={handleCloseDropdownMenu}
            />
          ) : (
            <Item
              key={`${index}-${id}`}
              {...item}
              disabled={isDragging || item.self.isDisabled}
              handleCloseDropdownMenu={handleCloseDropdownMenu}
            />
          );
        })}
      </section>
    </>
  );
};

export default Section;
