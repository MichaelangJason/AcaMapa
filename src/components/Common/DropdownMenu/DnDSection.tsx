"use client";
import { DraggingType } from "@/lib/enums";
import {
  Droppable,
  Draggable,
  DragDropContext,
  type DragDropContextProps,
} from "@hello-pangea/dnd";
import * as DM from "@radix-ui/react-dropdown-menu";
import Item, { type ItemProps } from "./Item";
import SubSection, { type SubSectionProps } from "./SubSection";

const DnDSection = ({
  label,
  handleCloseDropdownMenu,
  dndContextProps,
  items,
}: {
  label: string;
  items: (ItemProps | SubSectionProps)[];
  dndContextProps: Omit<DragDropContextProps, "children">;
  handleCloseDropdownMenu: () => void;
}) => {
  return (
    <>
      <DM.Label className="label">{label}</DM.Label>

      <DragDropContext {...dndContextProps}>
        <Droppable
          droppableId={DraggingType.PLAN}
          type={DraggingType.PLAN}
          renderClone={(provided, _, rubric) => (
            <Item
              self={{
                id: rubric.draggableId.split("-")[0],
                content: rubric.draggableId.split("-")[1],
                handleClick: () => {},
              }}
              handleCloseDropdownMenu={() => {}}
              draggableProvided={provided}
              className="dragging"
            />
          )}
        >
          {(droppableProvided) => (
            <section
              className="dropdown-menu-section"
              ref={droppableProvided.innerRef}
              {...droppableProvided.droppableProps}
            >
              {items.map((item, index) => {
                const id = item.self.id;
                const draggableId = [id, item.self.content].join("-");
                return (
                  <Draggable key={id} draggableId={draggableId} index={index}>
                    {(draggableProvided) =>
                      // REVIEW: better condition check
                      "items" in item ? (
                        <SubSection
                          {...item}
                          handleCloseDropdownMenu={handleCloseDropdownMenu}
                          draggableProvided={draggableProvided}
                        />
                      ) : (
                        <Item
                          {...item}
                          handleCloseDropdownMenu={handleCloseDropdownMenu}
                          draggableProvided={draggableProvided}
                        />
                      )
                    }
                  </Draggable>
                );
              })}
              {droppableProvided.placeholder}
            </section>
          )}
        </Droppable>
      </DragDropContext>
    </>
  );
};

export default DnDSection;
