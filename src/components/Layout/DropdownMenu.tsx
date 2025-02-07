import * as DM from '@radix-ui/react-dropdown-menu'
import { addPlan, setCurrentPlanId } from '@/store/slices/planSlice';
import '@/styles/dropdown.scss';
import Image from 'next/image';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';

const DropdownMenu = () => {
  const dispatch = useDispatch();
  const plans = useSelector((state: RootState) => Object.values(state.plans.data || {}));
  const currentPlanId = useSelector((state: RootState) => state.plans.currentPlanId);

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
        {plans.map((plan) => (
          <DM.Item
            className='dropdown-menu-item'
            key={plan.id}
            onClick={() => {
              dispatch(setCurrentPlanId(plan.id));
            }}
          >
            {plan.name}
            {plan.id === currentPlanId && <Image src="/slash.svg" alt="check" width={16} height={16} />}
          </DM.Item>
        ))}

        <DM.Separator className="dropdown-menu-separator" />

        <DM.Item className="dropdown-menu-item" onClick={() => {
          dispatch(addPlan());
        }}>
          Create new plan
        </DM.Item>

        <DM.Arrow className="dropdown-menu-arrow" />
      </DM.Content>
    </DM.Portal>
  </DM.Root>

  )
}

export default DropdownMenu;