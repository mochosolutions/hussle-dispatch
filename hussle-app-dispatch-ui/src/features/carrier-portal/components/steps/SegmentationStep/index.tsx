import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { LocalShipping, Hub, SyncAlt } from '@mui/icons-material';

import { useDispatch, useSelector } from 'store';
import config from '../../../../../config';
import type { Step } from 'features/carrier-portal/engine';

import { carrierPortalV2Actions } from '../../../store/reducers/carrierPortalSlice';
import {
  selectInvitation,
  selectLoading,
} from '../../../store/selectors/carrierPortalSelectors';
import type { SelectionCardOption } from '../../SelectionCardGrid';
import { useStepNavigation } from '../../StepNavContext';
import { SegmentationStepView } from './SegmentationStepView';

interface SegmentationStepProps {
  step: Step;
}

const DEFAULT_TITLE = "Welcome aboard. Let's get you running loads.";
const DEFAULT_SUBTITLE: ReactNode = (
  <>
    Takes about <strong>15 minutes</strong>. We&apos;ll handle the FMCSA lookup, calculate your
    minimum book rate, and have you ready for dispatch when you&apos;re done.
  </>
);

const ICON_BY_VALUE: Record<string, ReactNode> = {
  owner_operator: <LocalShipping />,
  small_fleet: <Hub />,
  dispatcher_carrier: <SyncAlt />,
};

const SegmentationStep: React.FC<SegmentationStepProps> = ({ step }) => {
  const dispatch = useDispatch();
  const invitation = useSelector(selectInvitation);
  const submitStatus = useSelector(selectLoading('submitStep'));

  const [selected, setSelected] = useState<string | null>(null);

  const question = step.questions?.[0];

  const options = useMemo<SelectionCardOption[]>(() => {
    if (!question?.options) {
      return [];
    }
    return question.options.map((opt) => ({
      id: opt.value,
      title: opt.label,
      subline: opt.description,
      icon: ICON_BY_VALUE[opt.value],
    }));
  }, [question]);

  const eyebrow = invitation?.organizationName
    ? `Invited by ${invitation.organizationName}`
    : `Invited to ${config.appName}`;

  const handleContinue = useCallback((): void => {
    if (!selected || !question) {
      return;
    }
    dispatch(
      carrierPortalV2Actions.submitStep({
        stepId: step.id,
        answers: { [question.id]: selected },
      }),
    );
  }, [dispatch, selected, question, step.id]);

  const isPending = submitStatus === 'pending';

  useStepNavigation({
    canContinue: selected !== null && !isPending,
    onContinue: handleContinue,
    isPending,
  });

  return (
    <SegmentationStepView
      eyebrow={eyebrow}
      title={step.title ?? DEFAULT_TITLE}
      subtitle={DEFAULT_SUBTITLE}
      question={{
        label: question?.label ?? '',
        required: !question?.optional,
        options,
      }}
      value={selected}
      onChange={setSelected}
      hideContinue
    />
  );
};

export default SegmentationStep;
