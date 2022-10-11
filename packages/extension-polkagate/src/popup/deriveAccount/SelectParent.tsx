// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { canDerive } from '@polkadot/extension-base/utils';

import { AccountContext, ActionContext, Label, Warning } from '../../../../extension-ui/src/components';
import { validateAccount, validateDerivationPath } from '../../../../extension-ui/src/messaging';
import DerivationPath from '../../../../extension-ui/src/Popup/Derive/DerivationPath';
import { nextDerivationPath } from '../../../../extension-ui/src/util/nextDerivationPath';
import Address from '../../components/Address';
import InputWithLabel from '../../components/InputWithLabel';
import PButton from '../../components/PButton';
import useTranslation from '../../hooks/useTranslation';
import AddressDropdown from './AddressDropdown';

interface Props {
  className?: string;
  isLocked?: boolean;
  parentAddress: string;
  parentName: string;
  parentGenesis: string | null;
  onDerivationConfirmed: (derivation: { account: { address: string; suri: string }; parentPassword: string }) => void;
}

// match any single slash
const singleSlashRegex = /([^/]|^)\/([^/]|$)/;

export default function SelectParent({ className, isLocked, parentName, onDerivationConfirmed, parentAddress, parentGenesis }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const [isBusy, setIsBusy] = useState(false);
  const { accounts, hierarchy } = useContext(AccountContext);
  const defaultPath = useMemo(() => nextDerivationPath(accounts, parentAddress), [accounts, parentAddress]);
  const [suriPath, setSuriPath] = useState<null | string>(defaultPath);
  const [parentPassword, setParentPassword] = useState<string>('');
  const [isProperParentPassword, setIsProperParentPassword] = useState(false);
  const [pathError, setPathError] = useState('');
  const passwordInputRef = useRef<HTMLDivElement>(null);
  const allowSoftDerivation = useMemo(() => {
    const parent = accounts.find(({ address }) => address === parentAddress);

    return parent?.type === 'sr25519';
  }, [accounts, parentAddress]);

  // reset the password field if the parent address changes
  useEffect(() => {
    setParentPassword('');
  }, [parentAddress]);

  useEffect(() => {
    // forbid the use of password since Keyring ignores it
    if (suriPath?.includes('///')) {
      setPathError(t('`///password` not supported for derivation'));
    }

    if (!allowSoftDerivation && suriPath && singleSlashRegex.test(suriPath)) {
      setPathError(t('Soft derivation is only allowed for sr25519 accounts'));
    }
  }, [allowSoftDerivation, suriPath, t]);
  console.log('hierarchy:', hierarchy);
  const allAddresses = useMemo(
    () => hierarchy
      .filter(({ isExternal }) => !isExternal)
      .filter(({ type }) => canDerive(type))
      .map(({ address, genesisHash, name }): [string, string | null, string | undefined] => [address, genesisHash || null, name]),
    [hierarchy]
  );

  const _onParentPasswordEnter = useCallback(
    (parentPassword: string): void => {
      setParentPassword(parentPassword);
      setIsProperParentPassword(!!parentPassword);
    },
    []
  );

  const _onSuriPathChange = useCallback(
    (path: string): void => {
      setSuriPath(path);
      setPathError('');
    },
    []
  );

  const _onParentChange = useCallback(
    (address: string) => onAction(`/account/derive/${address}`),
    [onAction]
  );

  const _onSubmit = useCallback(
    async (): Promise<void> => {
      if (suriPath && parentAddress && parentPassword) {
        setIsBusy(true);

        const isUnlockable = await validateAccount(parentAddress, parentPassword);

        if (isUnlockable) {
          try {
            const account = await validateDerivationPath(parentAddress, suriPath, parentPassword);

            onDerivationConfirmed({ account, parentPassword });
          } catch (error) {
            setIsBusy(false);
            setPathError(t('Invalid derivation path'));
            console.error(error);
          }
        } else {
          setIsBusy(false);
          setIsProperParentPassword(false);
        }
      }
    },
    [parentAddress, parentPassword, onDerivationConfirmed, suriPath, t]
  );

  useEffect(() => {
    setParentPassword('');
    setIsProperParentPassword(false);

    passwordInputRef.current?.querySelector('input')?.focus();
  }, [_onParentPasswordEnter]);

  return (
    <>
      <div className={className}>
        {isLocked
          ? (
            <Address
              address={parentAddress}
              genesisHash={parentGenesis}
            />
          )
          : (
            <Label
              label={t<string>('Choose Parent Account')}
              style={{ margin: 'auto', paddingBlock: '20px', width: '92%' }}
            >
              <AddressDropdown
                allAddresses={allAddresses}
                onSelect={_onParentChange}
                selectedAddress={parentAddress}
                selectedGenesis={parentGenesis}
                selectedName={parentName}
              />
            </Label>
          )
        }
        <div
          ref={passwordInputRef}
          style={{ margin: 'auto', width: '92%' }}
        >
          <InputWithLabel
            data-input-password
            isError={!!parentPassword && !isProperParentPassword}
            isFocused
            label={t<string>('Password for the account to derive from')}
            onChange={_onParentPasswordEnter}
            type='password'
            value={parentPassword}

          />
          {!!parentPassword && !isProperParentPassword && (
            <Warning
              isBelowInput
              isDanger
            >
              {t('Wrong password')}
            </Warning>
          )}
          <DerivationPath
            defaultPath={defaultPath}
            isError={!!pathError}
            onChange={_onSuriPathChange}
            parentAddress={parentAddress}
            parentPassword={parentPassword}
            withSoftPath={allowSoftDerivation}
          />
          {(!!pathError) && (
            <Warning
              isBelowInput
              isDanger
            >
              {pathError}
            </Warning>
          )}
        </div>
      </div>
      <PButton
        _onClick={_onSubmit}
        disabled={!isProperParentPassword || !!pathError}
        text={t<string>('Next')}
      />
    </>
  );
}
