// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import React, { useMemo } from 'react';
import { Route, Switch } from 'react-router';

import { PHISHING_PAGE_REDIRECT } from '@polkadot/extension-base/defaults';
import AccountFS from '@polkadot/extension-polkagate/src/fullscreen/accountDetails';
import AddNewChain from '@polkadot/extension-polkagate/src/fullscreen/addNewChain';
import Governance from '@polkadot/extension-polkagate/src/fullscreen/governance';
import ReferendumPost from '@polkadot/extension-polkagate/src/fullscreen/governance/post';
import ManageIdentity from '@polkadot/extension-polkagate/src/fullscreen/manageIdentity';
import FullScreenManageProxies from '@polkadot/extension-polkagate/src/fullscreen/manageProxies';
import NFTAlbum from '@polkadot/extension-polkagate/src/fullscreen/nft';
import Onboarding from '@polkadot/extension-polkagate/src/fullscreen/onboarding';
import Send from '@polkadot/extension-polkagate/src/fullscreen/sendFund';
import SocialRecovery from '@polkadot/extension-polkagate/src/fullscreen/socialRecovery';
import Stake from '@polkadot/extension-polkagate/src/fullscreen/stake';
import PoolFS from '@polkadot/extension-polkagate/src/fullscreen/stake/pool';
import ManageValidatorsPoolfs from '@polkadot/extension-polkagate/src/fullscreen/stake/pool/commonTasks/manageValidators';
import SoloFS from '@polkadot/extension-polkagate/src/fullscreen/stake/solo';
import ManageValidators from '@polkadot/extension-polkagate/src/fullscreen/stake/solo/commonTasks/manageValidators';
import AccountEx from '@polkadot/extension-polkagate/src/popup/account';
import AuthList from '@polkadot/extension-polkagate/src/popup/authManagement';
import Authorize from '@polkadot/extension-polkagate/src/popup/authorize';
import CrowdLoans from '@polkadot/extension-polkagate/src/popup/crowdloans';
import Export from '@polkadot/extension-polkagate/src/popup/export/Export';
import ExportAll from '@polkadot/extension-polkagate/src/popup/export/ExportAll';
import ForgetAccount from '@polkadot/extension-polkagate/src/popup/forgetAccount';
import History from '@polkadot/extension-polkagate/src/popup/history';
import Home from '@polkadot/extension-polkagate/src/popup/home/ManageHome';
import AddWatchOnly from '@polkadot/extension-polkagate/src/popup/import/addWatchOnly';
import AddWatchOnlyFullScreen from '@polkadot/extension-polkagate/src/popup/import/addWatchOnlyFullScreen';
import AttachQR from '@polkadot/extension-polkagate/src/popup/import/attachQR';
import AttachQrFullScreen from '@polkadot/extension-polkagate/src/popup/import/attachQrFullScreen';
import ImportLedger from '@polkadot/extension-polkagate/src/popup/import/importLedger';
import ImportProxied from '@polkadot/extension-polkagate/src/popup/import/importProxied';
import ImportProxiedFullScreen from '@polkadot/extension-polkagate/src/popup/import/importProxiedFullScreen';
import ImportRawSeed from '@polkadot/extension-polkagate/src/popup/import/importRawSeedFullScreen';
import ImportSeed from '@polkadot/extension-polkagate/src/popup/import/importSeedFullScreen';
import RestoreJson from '@polkadot/extension-polkagate/src/popup/import/restoreJSONFullScreen';
import ManageProxies from '@polkadot/extension-polkagate/src/popup/manageProxies';
import Metadata from '@polkadot/extension-polkagate/src/popup/metadata';
import CreateAccount from '@polkadot/extension-polkagate/src/popup/newAccount/createAccountFullScreen';
import Derive from '@polkadot/extension-polkagate/src/popup/newAccount/deriveAccount';
import FullscreenDerive from '@polkadot/extension-polkagate/src/popup/newAccount/deriveFromAccountsFullscreen';
import NotificationSettings from '@polkadot/extension-polkagate/src/popup/notification/NotificationSettings';
import LoginPassword from '@polkadot/extension-polkagate/src/popup/passwordManagement';
import ForgotPassword from '@polkadot/extension-polkagate/src/popup/passwordManagement/ForgotPasswordFS';
import ResetWallet from '@polkadot/extension-polkagate/src/popup/passwordManagement/ResetFS';
import PhishingDetected from '@polkadot/extension-polkagate/src/popup/PhishingDetected';
import Receive from '@polkadot/extension-polkagate/src/popup/receive';
import Rename from '@polkadot/extension-polkagate/src/popup/rename';
import Signing from '@polkadot/extension-polkagate/src/popup/signing';
import Pool from '@polkadot/extension-polkagate/src/popup/staking/pool';
import PoolInformation from '@polkadot/extension-polkagate/src/popup/staking/pool/myPool';
import PoolNominations from '@polkadot/extension-polkagate/src/popup/staking/pool/nominations';
import PoolStake from '@polkadot/extension-polkagate/src/popup/staking/pool/stake';
import CreatePool from '@polkadot/extension-polkagate/src/popup/staking/pool/stake/createPool';
import JoinPool from '@polkadot/extension-polkagate/src/popup/staking/pool/stake/joinPool';
import PoolUnstake from '@polkadot/extension-polkagate/src/popup/staking/pool/unstake';
import Solo from '@polkadot/extension-polkagate/src/popup/staking/solo';
import FastUnstake from '@polkadot/extension-polkagate/src/popup/staking/solo/fastUnstake';
import SoloNominations from '@polkadot/extension-polkagate/src/popup/staking/solo/nominations';
import SoloRestake from '@polkadot/extension-polkagate/src/popup/staking/solo/restake';
import SoloPayout from '@polkadot/extension-polkagate/src/popup/staking/solo/rewards/PendingRewards';
import SoloStake from '@polkadot/extension-polkagate/src/popup/staking/solo/stake';
import TuneUp from '@polkadot/extension-polkagate/src/popup/staking/solo/tuneUp';
import SoloUnstake from '@polkadot/extension-polkagate/src/popup/staking/solo/unstake';

import RouteWrapper from '../components/RouteWrapper';

interface RouteConfig {
  path: string;
  Component: React.ComponentType<any>;
  trigger: string;
  props?: Record<string, unknown>;
  exact?: boolean;
}

// Account Management Routes
const ACCOUNT_ROUTES: RouteConfig[] = [
  {
    Component: AccountEx,
    path: '/account/:genesisHash/:address/',
    trigger: 'account'
  },
  {
    Component: CreateAccount,
    path: '/account/create',
    trigger: 'account-creation'
  },
  {
    Component: ExportAll,
    path: '/account/export-all',
    trigger: 'export-all-address'
  },
  {
    Component: ImportLedger,
    path: '/account/import-ledger',
    trigger: 'import-ledger'
  },
  {
    Component: ImportSeed,
    path: '/account/import-seed',
    trigger: 'import-seed'
  },
  {
    Component: ImportRawSeed,
    path: '/account/import-raw-seed',
    trigger: 'import-raw-seed'
  },
  {
    Component: RestoreJson,
    path: '/account/restore-json',
    trigger: 'restore-json'
  },
  {
    Component: AccountFS,
    path: '/accountfs/:address/:paramAssetId',
    trigger: 'account'
  },
  {
    Component: Export,
    path: '/export/:address',
    trigger: 'export-address'
  },
  {
    Component: ForgetAccount,
    path: '/forget/:address/:isExternal',
    trigger: 'forget-address'
  },
  {
    Component: Rename,
    path: '/rename/:address',
    trigger: 'rename'
  },
  {
    Component: Receive,
    path: '/receive/:address',
    trigger: 'receive'
  }
];

// Import Related Routes
const IMPORT_ROUTES: RouteConfig[] = [
  {
    Component: AddWatchOnly,
    path: '/import/add-watch-only',
    trigger: 'import-add-watch-only'
  },
  {
    Component: AddWatchOnlyFullScreen,
    path: '/import/add-watch-only-full-screen',
    trigger: 'import-add-watch-only-full-screen'
  },
  {
    Component: AttachQR,
    path: '/import/attach-qr',
    trigger: 'attach-qr'
  },
  {
    Component: AttachQrFullScreen,
    path: '/import/attach-qr-full-screen',
    trigger: 'attach-qr-full-screen'
  },
  {
    Component: ImportProxied,
    path: '/import/proxied',
    trigger: 'import-proxied'
  },
  {
    Component: ImportProxiedFullScreen,
    path: '/import/proxied-full-screen',
    trigger: 'import-proxied-full-screen'
  }
];

// Staking Routes
const STAKING_ROUTES: RouteConfig[] = [
  // Pool Staking
  {
    Component: CreatePool,
    path: '/pool/create/:address',
    trigger: 'pool-create'
  },
  {
    Component: JoinPool,
    path: '/pool/join/:address',
    trigger: 'pool-join'
  },
  {
    Component: PoolStake,
    path: '/pool/stake/:address',
    trigger: 'pool-stake'
  },
  {
    Component: PoolInformation,
    path: '/pool/myPool/:address',
    trigger: 'pool-poolInformation'
  },
  {
    Component: PoolNominations,
    path: '/pool/nominations/:address',
    trigger: 'pool-nominations'
  },
  {
    Component: PoolUnstake,
    path: '/pool/unstake/:address',
    trigger: 'pool-unstake'
  },
  {
    Component: Pool,
    path: '/pool/:address',
    trigger: 'pool-staking'
  },
  {
    Component: PoolFS,
    path: '/poolfs/:address',
    trigger: 'pool-staking-fullscreen'
  },
  // Solo Staking
  {
    Component: FastUnstake,
    path: '/solo/fastUnstake/:address',
    trigger: 'solo-fast-unstake'
  },
  {
    Component: SoloNominations,
    path: '/solo/nominations/:address',
    trigger: 'solo-nominations'
  },
  {
    Component: SoloPayout,
    path: '/solo/payout/:address',
    trigger: 'solo-payout'
  },
  {
    Component: SoloRestake,
    path: '/solo/restake/:address',
    trigger: 'solo-restake'
  },
  {
    Component: SoloStake,
    path: '/solo/stake/:address',
    trigger: 'solo-stake'
  },
  {
    Component: SoloUnstake,
    path: '/solo/unstake/:address',
    trigger: 'solo-unstake'
  },
  {
    Component: Solo,
    path: '/solo/:address',
    trigger: 'solo-staking'
  },
  {
    Component: SoloFS,
    path: '/solofs/:address',
    trigger: 'solo-staking-fullscreen'
  },
  {
    Component: Stake,
    path: '/stake/:address',
    trigger: 'stake'
  },
  {
    Component: TuneUp,
    path: '/tuneup/:address',
    trigger: 'tuneup'
  }
];

// Feature Routes
const FEATURE_ROUTES: RouteConfig[] = [
  {
    Component: AddNewChain,
    path: '/addNewChain/',
    trigger: 'add-new-chain'
  },
  {
    Component: AuthList,
    path: '/auth-list/:id?',
    trigger: 'auth-list'
  },
  {
    Component: CrowdLoans,
    path: '/crowdloans/:address',
    trigger: 'crowdloans'
  },
  {
    Component: FullScreenManageProxies,
    path: '/fullscreenProxyManagement/:address/',
    trigger: 'fullscreen-proxy-management'
  },
  {
    Component: ReferendumPost,
    path: '/governance/:address/:topMenu/:postId',
    trigger: 'governance'
  },
  {
    Component: Governance,
    path: '/governance/:address/:topMenu',
    trigger: 'governance'
  },
  {
    Component: History,
    path: '/history/:address',
    trigger: 'history'
  },
  {
    Component: NotificationSettings,
    path: '/manage-notification',
    trigger: 'manageNotification'
  },
  {
    Component: ManageProxies,
    path: '/manageProxies/:address',
    trigger: 'manageProxies'
  },
  {
    Component: ManageIdentity,
    path: '/manageIdentity/:address',
    trigger: 'manage-identity'
  },
  {
    Component: ManageValidators,
    path: '/manageValidators/:address',
    trigger: 'manage-validators-fullscreen'
  },
  {
    Component: ManageValidatorsPoolfs,
    path: '/managePoolValidators/:address',
    trigger: 'manage-validators-fullscreen'
  },
  {
    Component: NFTAlbum,
    path: '/nft/:address',
    trigger: 'nft-album'
  },
  {
    Component: Send,
    path: '/send/:address/:assetId', // full-screen send page
    trigger: 'send'
  },
  {
    Component: SocialRecovery,
    path: '/socialRecovery/:address/:closeRecovery',
    trigger: 'social-recovery'
  }
];

// Derive Routes
const DERIVE_ROUTES: RouteConfig[] = [
  {
    Component: Derive,
    path: '/derive/:address/locked',
    props: { isLocked: true },
    trigger: 'derived-address-locked'
  },
  {
    Component: Derive,
    path: '/derive/:address',
    trigger: 'derive-address'
  },
  {
    Component: FullscreenDerive,
    path: '/derivefs/:address/',
    trigger: 'fullscreen-account-derive'
  }
];

// Password Management Routes
const PASSWORD_ROUTES: RouteConfig[] = [
  {
    Component: LoginPassword,
    path: '/login-password',
    trigger: 'manage-login-password'
  },
  {
    Component: ForgotPassword,
    path: '/forgot-password',
    trigger: 'forgot-password'
  },
  {
    Component: ResetWallet,
    path: '/reset-wallet',
    trigger: 'reset-wallet'
  }
];

const ROOT_ROUTES: RouteConfig[] = [
  {
    Component: Onboarding,
    path: '/onboarding',
    trigger: 'onboarding'
  },
  {
    Component: PhishingDetected,
    path: `${PHISHING_PAGE_REDIRECT}/:website`,
    trigger: 'phishing-page-redirect'
  },
  {
    Component: Home,
    exact: true,
    path: '/',
    trigger: 'accounts'
  },
  {
    Component: Authorize,
    path: '/authorize',
    trigger: 'authorize'
  },
  {
    Component: Metadata,
    path: '/metadata',
    trigger: 'metadata'
  },
  {
    Component: Signing,
    path: '/signing',
    trigger: 'signing'
  }
];

const ALL_ROUTES: RouteConfig[] = [
  ...ACCOUNT_ROUTES,
  ...STAKING_ROUTES,
  ...IMPORT_ROUTES,
  ...FEATURE_ROUTES,
  ...DERIVE_ROUTES,
  ...PASSWORD_ROUTES,
  ...ROOT_ROUTES
];

export default function Routes () {
  const routeComponents = useMemo(() =>
    ALL_ROUTES.map(({ Component, exact, path, props, trigger }) => (
      <Route
        exact={exact}
        key={path}
        path={path}
      >
        <RouteWrapper
          component={Component}
          props={props}
          trigger={trigger}
        />
      </Route>
    )), []);

  return (
    <Switch>
      {routeComponents}
    </Switch>
  );
}
