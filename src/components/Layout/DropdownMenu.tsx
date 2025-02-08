import * as DM from '@radix-ui/react-dropdown-menu'
import { addPlan, setCurrentPlanId } from '@/store/slices/planSlice';
import '@/styles/dropdown.scss';
import Image from 'next/image';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { DraggingType } from '@/utils/enums';
import { useCallback } from 'react';

const DropdownMenu = () => {
  const dispatch = useDispatch();
  const plans = useSelector((state: RootState) => state.plans.data);
  const planOrder = useSelector((state: RootState) => state.plans.order);
  const currentPlanId = useSelector((state: RootState) => state.plans.currentPlanId);
  const isDragging = useSelector((state: RootState) => state.global.draggingType);
  const isInitialized = useSelector((state: RootState) => state.global.isInitialized);

  const handleAddPlan = useCallback(() => {
    if (isDragging) return;
    dispatch(addPlan());
  }, [isDragging, dispatch]);

  if (!isInitialized) return (
    <div className='hamburger-button'>
      <Image src="/hamburger.svg" alt="hambergur" width={20} height={20} />
    </div>
  )

  return (
    <DM.Root>
      <DM.Trigger className="hamburger-button" asChild>
        <Image src="/hamburger.svg" alt="hambergur" width={20} height={20} />
      </DM.Trigger>

      <DM.Portal>
        <DM.Content className="dropdown-menu-content" align='start'>
          <DM.Label className="dropdown-menu-label">
            Plans
          </DM.Label>

          <Droppable
            droppableId={DraggingType.PLAN}
            type={DraggingType.PLAN}
            renderClone={(provided, snapshot, rubric) => (
              <div
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                ref={provided.innerRef}
                className='dropdown-menu-dragging'
              >
                <Image 
                  src="/slash.svg" 
                  alt="check" 
                  width={16} 
                  height={16} 
                  style={{ 
                    opacity: 0,
                    marginRight: '5px'
                  }} 
                />
                {plans[rubric.draggableId].name}
              </div>
            )}
          >
            {(provided) => {
              return (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {planOrder.map((planId, index) => (
                    <Draggable key={planId} draggableId={planId} index={index}>
                      {(provided) => {
                        return (
                          <div
                            ref={provided.innerRef}
                            {...provided.dragHandleProps}
                            {...provided.draggableProps}
                            className='dropdown-menu-item'
                            id={planId}
                            onClick={() => {
                              dispatch(setCurrentPlanId(planId));
                            }}
                          >
                            <Image 
                              src="/globe.svg" 
                              alt="check" 
                              width={16}
                              height={16} 
                              style={{ 
                                opacity: planId === currentPlanId ? 1 : 0,
                                marginRight: '5px'
                              }} 
                            />
                            <div style={{ flexGrow: 1 }}>
                              {plans[planId].name}
                            </div>

                            <DM.Sub>
                              <DM.SubTrigger>
                                -&gt;
                              </DM.SubTrigger>

                              <DM.SubContent className='dropdown-menu-content' sideOffset={12}>
                                <DM.Item>
                                  Delete
                                </DM.Item>
                              </DM.SubContent>
                            </DM.Sub>
                          </div>
                        )
                      }}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )
            }}
          </Droppable>

          <DM.Separator className="dropdown-menu-separator" />

          <DM.Item className="dropdown-menu-item" onClick={handleAddPlan}>
            Create new plan
          </DM.Item>

          <DM.Sub>
            <div className="dropdown-menu-item">
              Test
              <DM.SubTrigger className="">
                import
              </DM.SubTrigger>
            </div>
            <DM.SubContent className="dropdown-menu-content" >
              <DM.Item className="dropdown-menu-item">
                Import from file
              </DM.Item>
            </DM.SubContent>
          </DM.Sub>

          <DM.Arrow className="dropdown-menu-arrow" />
        </DM.Content>
      </DM.Portal>
    </DM.Root>

  )
}

export default DropdownMenu;