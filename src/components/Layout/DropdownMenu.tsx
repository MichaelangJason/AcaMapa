import * as DM from '@radix-ui/react-dropdown-menu'
import { addPlan, setCurrentPlanId, removePlan, setPlanName } from '@/store/slices/planSlice';
import { setIsUtilityDropdownMenuOpen, toggleCourseTakenExpanded, toggleSideBarExpanded, toggleUtilityDropdownMenuOpen } from '@/store/slices/globalSlice';
import '@/styles/dropdown.scss';
import Image from 'next/image';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { DraggingType, ModalType } from '@/utils/enums';
import { useRef, useState } from 'react';
import { addTerm } from '@/store/slices/termSlice';
import { getShortcutByDevice } from '@/utils';
import '@/styles/modal.scss';
import RenameConfirmModal, { RenameConfirmModalInfo } from './RenameConfirmModal';
import Modal from 'react-modal'

Modal.setAppElement('body');

const DropdownMenu = (props: {
  setIsAboutModalOpen: (isOpen: boolean) => void;
  setIsTutorialModalOpen: (isOpen: boolean) => void;
}) => {
  const dispatch = useDispatch();
  const plans = useSelector((state: RootState) => state.plans.data);
  const planOrder = useSelector((state: RootState) => state.plans.order);
  const currentPlanId = useSelector((state: RootState) => state.plans.currentPlanId);
  const isInitialized = useSelector((state: RootState) => state.global.isInitialized);
  const isOpen = useSelector((state: RootState) => state.global.isUtilityDropdownMenuOpen);
  const DMRef = useRef<HTMLDivElement>(null);
  const isDragging = useSelector((state: RootState) => state.global.isDragging);
  const handleCloseDropdownMenu = () => {
    dispatch(setIsUtilityDropdownMenuOpen(false));
  }
  // the modal state are generally mutually exclusive
  const [modalInfo, setModalInfo] = useState<RenameConfirmModalInfo | undefined>(undefined);

  const { setIsAboutModalOpen, setIsTutorialModalOpen } = props;
  const handleCloseModal = () => {
    setModalInfo(undefined);
  }

  const options = [
    {
      label: 'New Plan',
      onClick: () => {
        dispatch(addPlan())
        handleCloseDropdownMenu()
      },
      shortcut: getShortcutByDevice('p')
    },
    {
      label: 'New Term',
      onClick: () => {
        dispatch(addTerm())
        handleCloseDropdownMenu()
      },
      shortcut: getShortcutByDevice('n')
    },
    {
      label: 'Delete Current Plan',
      onClick: () => {
        dispatch(removePlan(currentPlanId))
        handleCloseDropdownMenu()
      }
    },
    {
      label: 'Toggle Sidebar',
      onClick: () => {
        dispatch(toggleSideBarExpanded())
        handleCloseDropdownMenu()
      },
      shortcut: getShortcutByDevice('b')
    },
    {
      label: 'Toggle Course Taken',
      onClick: () => {
        dispatch(toggleCourseTakenExpanded())
        handleCloseDropdownMenu()
      },
      shortcut: getShortcutByDevice('l')
    },
    {
      label: 'About',
      // onClick: () => dispatch(setIsAboutModalOpen(true))
      onClick: () => {
        setIsAboutModalOpen(true);
        handleCloseDropdownMenu();
      }
    },
    {
      label: 'Tutorial',
      // onClick: () => dispatch(setIsTutorialModalOpen(true))
      onClick: () => {
        setIsTutorialModalOpen(true);
        handleCloseDropdownMenu();
      }
    },
    {
      label: 'Close Dropdown Menu',
      onClick: () => dispatch(setIsUtilityDropdownMenuOpen(false)),
      shortcut: getShortcutByDevice('m')
    }
  ]

  if (!isInitialized) return (
    <div className='hamburger-button'>
      <Image src="/hamburger.svg" alt="hambergur" width={20} height={20} />
    </div>
  )



  return (
    <>
      <DM.Root modal={false} open={isOpen}>
        <DM.Trigger
          className="hamburger-button"
          asChild
          onClick={() => dispatch(toggleUtilityDropdownMenuOpen())}
        >
          <Image src="/hamburger.svg" alt="hambergur" width={20} height={20} />
        </DM.Trigger>

        <DM.Portal>
          <DM.Content className="dropdown-menu-content"
            align='start'
            sideOffset={8}
            ref={DMRef}
            onCloseAutoFocus={handleCloseDropdownMenu}
            onFocusOutside={handleCloseDropdownMenu}
            onPointerDownOutside={handleCloseDropdownMenu}
            onEscapeKeyDown={handleCloseDropdownMenu}
            onInteractOutside={handleCloseDropdownMenu}
          >
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
                  <div className="indicator" />
                  <div className='name'>
                    {plans[rubric.draggableId].name}
                  </div>
                </div>
              )}
            >
              {(provided) => {
                return (
                  <div ref={provided.innerRef} {...provided.droppableProps} style={{ width: '100%' }}>
                    {planOrder.map((planId, index) => (
                      <Draggable key={planId} draggableId={planId} index={index}>
                        {(provided) => {
                          return (
                            <DM.Sub>
                              <DM.SubTrigger
                                ref={provided.innerRef}
                                {...provided.dragHandleProps}
                                {...provided.draggableProps}
                                className='dropdown-menu-item'
                                id={planId}
                                onClick={() => {
                                  dispatch(setCurrentPlanId(planId));
                                  handleCloseDropdownMenu()
                                }}
                              >
                                <div className='indicator' style={planId === currentPlanId && !isDragging ? { opacity: 1 } : {}}>
                                  &gt;
                                </div>
                                <div className='name'>
                                  <div className='placeholder' />
                                  {plans[planId].name}
                                </div>
                                <Image src="/submenu-arrow.svg" alt="submenu" width={12} height={12} className='submenu-arrow' />
                                <div className='indicator' />
                              </DM.SubTrigger>

                              <DM.Portal>
                                <DM.SubContent className='dropdown-menu-content'>
                                  <DM.Item
                                    className='dropdown-menu-item'
                                    onClick={(e) => {
                                      e.stopPropagation();

                                      // dispatch(removePlan(planId));
                                      setModalInfo({
                                        type: ModalType.DELETE,
                                        closeCb: handleCloseModal,
                                        confirmCb: () => { 
                                          dispatch(removePlan(planId)) 
                                        },
                                        text: plans[planId].name
                                      });
                                    }}
                                  >
                                    <div className='name'>
                                      Delete
                                    </div>
                                  </DM.Item>
                                  <DM.Item
                                    className='dropdown-menu-item'
                                    onClick={(e) => {
                                      e.stopPropagation();

                                      const name = plans[planId].name;
                                      setModalInfo({
                                        type: ModalType.RENAME,
                                        closeCb: handleCloseModal,
                                        confirmCb: (newValue: string) => { 
                                          dispatch(setPlanName({ planId: planId, name: newValue || name })) 
                                        },
                                        text: name
                                      });
                                    }}
                                  >
                                    <div className='name'>
                                      Rename
                                    </div>
                                  </DM.Item>
                                </DM.SubContent>
                              </DM.Portal>
                            </DM.Sub>
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

            <DM.Label className="dropdown-menu-label">
              Actions
            </DM.Label>
            {options.map((option) => (
              <DM.Item className="dropdown-menu-item" key={option.label} onClick={option.onClick}>
                <div className='indicator' />
                <div className='name'>
                  {option.label}
                </div>
                <div className='placeholder' />
                {option.shortcut && <span className="shortcut">{option.shortcut}</span>}
                <div className='indicator' />
              </DM.Item>
            ))}

          </DM.Content>
        </DM.Portal>
      </DM.Root>
      {modalInfo && (
        <RenameConfirmModal modalInfo={modalInfo} />
      )}
    </>
  )
}

export default DropdownMenu;