// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { StakingConsts, ValidatorInfo, ValidatorInfoWithIdentity } from '../util/types';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { getComparator } from '../popup/staking/partial/comparators';
import { DEFAULT_FILTERS } from '../util/constants';
import { useStakingConsts, useValidators, useValidatorsIdentities } from '.';

/**
 * @description
 * This hooks return a list of suggested validators to choose
 */

export default function useValidatorSuggestion(address: string): ValidatorInfo[] | null | undefined {
  const allValidatorsInfo = useValidators(address);
  const allValidatorsAccountIds = useMemo(() => allValidatorsInfo && allValidatorsInfo.current.concat(allValidatorsInfo.waiting)?.map((v) => v.accountId), [allValidatorsInfo]);
  const allValidatorsIdentities = useValidatorsIdentities(address, allValidatorsAccountIds);
  const stakingConsts = useStakingConsts(address);

  const [selected, setSelected] = useState<ValidatorInfo[] | undefined>();

  const allValidators = useMemo(() => allValidatorsInfo?.current?.concat(allValidatorsInfo.waiting)?.filter((v) => v.validatorPrefs.blocked as unknown as boolean === false || v.validatorPrefs.blocked.isFalse), [allValidatorsInfo]);

  const onLimitValidatorsPerOperator = useCallback((validators: ValidatorInfoWithIdentity[] | undefined, limit: number): ValidatorInfoWithIdentity[] => {
    if (!validators?.length) {
      return [];
    }

    const aDeepCopyOfValidators = JSON.parse(JSON.stringify(validators)) as ValidatorInfoWithIdentity[];

    aDeepCopyOfValidators.forEach((v) => {
      const vId = allValidatorsIdentities?.find((vi) => vi.accountId === v.accountId);

      v.identity = vId?.identity;
    });

    aDeepCopyOfValidators.sort((v1, v2) => ('' + v1?.identity?.displayParent).localeCompare(v2?.identity?.displayParent || ''));

    let counter = 1;
    let indicator = aDeepCopyOfValidators[0];

    return aDeepCopyOfValidators.filter((v, index) => {
      if (indicator.identity?.displayParent && indicator.identity?.displayParent === v.identity?.displayParent && limit >= counter++) {
        return true;
      }

      if (indicator.identity?.displayParent && indicator.identity?.displayParent === v.identity?.displayParent) {
        return false;
      }

      counter = 1;
      indicator = aDeepCopyOfValidators[index + 1];

      return true;
    });
  }, [allValidatorsIdentities]);

  // TODO: Can research to find a better algorithm to select validators automatically
  const selectBestValidators = useCallback((allValidators: ValidatorInfo[], stakingConsts: StakingConsts): ValidatorInfo[] => {
    const filtered1 = allValidators.filter((v) =>
      // !v.validatorPrefs.blocked && // filter blocked validators
      Number(v.validatorPrefs.commission) !== 0 && // filter 0 commission validators, to exclude new and chilled validators
      (Number(v.validatorPrefs.commission) / (10 ** 7)) < DEFAULT_FILTERS.maxCommission.value && // filter high commission validators
      v.exposure?.others?.length && v.exposure.others.length < stakingConsts?.maxNominatorRewardedPerValidator// filter oversubscribed
      // && v.exposure.others.length > stakingConsts?.maxNominatorRewardedPerValidator / 4 // filter validators with very low nominators
    );
    const filtered2 = onLimitValidatorsPerOperator(filtered1, DEFAULT_FILTERS.limitOfValidatorsPerOperator.value);

    const filtered3 = allValidatorsIdentities?.length
      ? filtered2.filter((v) => v?.identity?.display && v?.identity?.judgements?.length) // filter those who has no verified identity
      : filtered2;

    const filtered = filtered3.length ? filtered3 : filtered2;

    return filtered.sort(getComparator('Commissions')).slice(0, stakingConsts?.maxNominations);
  }, [allValidatorsIdentities?.length, onLimitValidatorsPerOperator]);

  useEffect(() => {
    if (!allValidators || !stakingConsts) {
      return;
    }

    setSelected([...selectBestValidators(allValidators, stakingConsts)]);
  }, [allValidators, selectBestValidators, stakingConsts]);

  return selected;
}
