// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { SoloSettings } from '../../../../../util/types';

export default function getPayee (settings: SoloSettings): string | undefined {
  if (settings.payee === 'Stash') {
    return settings?.stashId && String(settings.stashId);
  }

  if (settings.payee === 'Controller') {
    return settings?.controllerId && String(settings.controllerId);
  }

  // @ts-ignore
  return settings.payee?.Account ? String(settings.payee.Account) : undefined;
}
