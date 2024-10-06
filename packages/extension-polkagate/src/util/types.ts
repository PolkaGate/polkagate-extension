// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

//@ts-nocheck

import type { LinkOption } from '@polkagate/apps-config/endpoints/types';
import type React from 'react';
import type { ApiPromise } from '@polkadot/api';
import type { SubmittableExtrinsicFunction } from '@polkadot/api/promise/types';
import type { DeriveAccountInfo, DeriveAccountRegistration, DeriveBalancesAll, DeriveCollectiveProposal, DeriveElectionsInfo, DeriveProposal, DeriveReferendumExt, DeriveStakingAccount, DeriveStakingQuery } from '@polkadot/api-derive/types';
import type { AccountJson, AccountWithChildren } from '@polkadot/extension-base/background/types';
import type { Chain } from '@polkadot/extension-chains/types';
import type { InjectedExtension } from '@polkadot/extension-inject/types';
import type { Balance } from '@polkadot/types/interfaces';
import type { AccountId } from '@polkadot/types/interfaces/runtime';
import type { PalletNominationPoolsBondedPoolInner, PalletNominationPoolsPoolMember, PalletNominationPoolsRewardPool } from '@polkadot/types/lookup';
import type { BN } from '@polkadot/util';
import type { KeypairType } from '@polkadot/util-crypto/types';
import type { LatestReferenda } from '../fullscreen/governance/utils/types';
import type { CurrencyItemType } from '../fullscreen/homeFullScreen/partials/Currency';
import type { SavedAssets } from '../hooks/useAssetsBalances';

import { type SxProps, type Theme } from '@mui/material';

export interface TransactionStatus {
  blockNumber: string | null;
  success: boolean | null;
  text: string | null;
}

export interface LastBalances {
  availableBalance: BN;
  decimals: number[];
  tokens: string[];
  freeBalance: BN;
  reservedBalance: BN;
  // frozenMisc: BN;
  // frozenFee: BN;
  lockedBalance: BN;
  vestedBalance: BN;
  vestedClaimable: BN;
  votingBalance: BN;
}

export const DEFAULT_ACCOUNT_BALANCE = { address: null, balanceInfo: null, chain: null, name: null };

export interface StakingConsts {
  bondingDuration: number; // eras
  eraIndex: number;
  existentialDeposit: BN;
  maxNominations: number;
  maxNominatorRewardedPerValidator: number;
  minNominatorBond: BN;
  token: string;
  unbondingDuration: number; // days
}

export interface NominatorInfo {
  minNominated: BN;
  isInList: boolean // is Nominator in top 22500 elected
  eraIndex: number;
}

export interface Other {
  who: string;
  value: BN;
}
export interface ValidatorInfo extends DeriveStakingQuery {
  exposure: {
    own: BN,
    total: BN,
    others: Other[]
  };
  accountInfo?: DeriveAccountInfo;
  isOversubscribed?: {
    notSafe: boolean;
    safe: boolean;
  }
}

export interface AllValidators {
  current: ValidatorInfo[];
  waiting: ValidatorInfo[];
  eraIndex: number;
}

export interface Validators {
  current: DeriveStakingQuery[];
  waiting: DeriveStakingQuery[];
  eraIndex: number;
}
export interface ValidatorsIdentities {
  accountsInfo: DeriveAccountInfo[] | null;
  eraIndex: number;
}

export interface SavedValidatorsIdentities {
  [chainName: string]: ValidatorsIdentities;
}

export interface AllValidatorsFromSubscan {
  current: ValidatorsFromSubscan[];
  waiting: ValidatorsFromSubscan[]
}

export interface ValidatorsName {
  address: string;
  name: string;
}

export interface SavedMetaData {
  chainName: string;
  metaData: any
}

export interface ValidatorsFromSubscan {
  bonded_nominators: string;
  bonded_owner: string;
  bonded_total?: string;
  controller_account_display?: stashAccountDisplay;
  count_nominators: number;
  grandpa_vote?: number;
  latest_mining?: number;
  node_name: string;
  rank_validator?: number;
  reward_account: string;
  reward_point?: number;
  reward_pot_balance: string;
  session_key?: any;
  stash_account_display: stashAccountDisplay;
  validator_prefs_value: number;
}

interface stashAccountDisplay {
  account_index: string;
  address: string;
  display: string;
  identity: boolean;
  judgements: any;
  parent: any;
}

export interface TxResult {
  block?: number;
  txHash?: string;
  fee?: string;
  success: boolean;
  failureText?: string;
}
export interface TransactionDetail extends TxResult {
  action: string; // send, Solo staking, pool staking ...
  amount?: string;
  chain?: Chain;
  date: number;
  from: NameAddress;
  subAction?: string; // bond_extra, unbound, nominate
  to?: NameAddress;
  token?: string;
  throughProxy?: NameAddress;
}

export interface TxInfo extends TransactionDetail {
  api: ApiPromise;
  chain: Chain;
  decimal?: number;
  recipientChainName?: string;
  token?: string;
  poolName?: string;
  validatorsCount?: number;
  payee?: Payee,
}

export interface Auction {
  auctionCounter: number;
  auctionInfo: [string, string];
  blockchain: string;
  crowdloans: Crowdloan[];
  currentBlockNumber: number;
  minContribution: string;
  token: string;
  winning: string[];
}

export interface Crowdloan {
  fund: Fund;
  identity: Identity;
}

interface Fund {
  depositor: string;
  verifier: string | null;
  deposit: string;
  raised: string;
  end: number;
  cap: string;
  lastContribution: { ending: bigint };
  firstPeriod: number;
  lastPeriod: number;
  trieIndex: number;
  paraId: string;
  hasLeased: boolean;
  contributionBlock?: number;
  contributionTimestamp?: number;
  unlockingBlock?: number;
}

interface Identity {
  // 'judgements': [],
  //  'deposit':202580000000,
  'info': {
    // 'additional':[],
    'display'?: string;
    'legal'?: string;
    'web'?: string;
    //  'riot':{'none':null},
    'email'?: string;
    //  'pgpFingerprint':null,
    //  'image':{'none':null},
    'twitter'?: string;
  }
}

export interface TransferRequest {
  code: number;
  data: {
    list: any;
    count: number;
    transfers: Transfers[];
  };
  generated_at: number;
  message: string;
}

export interface TipsRequest {
  code: number;
  data: {
    count: number;
    list: Tip[];
  };
  generated_at: number;
  message: string;
}

export interface Transfers {
  amount: string;
  asset_symbol: string;
  block_num: number;
  block_timestamp: number;
  extrinsic_index: string;
  fee: string;
  from: string;
  from_account_display: AccountDisplay;
  hash: string;
  module: string;
  nonce: number;
  success: boolean
  to: string;
  to_account_display: AccountDisplay;
}

interface AccountDisplay {
  address: string;
  display: string;
  judgements: string;
  account_index: string;
  identity: boolean;
  parent: any;
}

export interface CouncilInfo extends DeriveElectionsInfo {
  accountInfos: DeriveAccountInfo[];
}

export interface PersonsInfo {
  desiredSeats?: number;
  backed?: string[];
  infos: DeriveAccountInfo[]
}

export interface MotionsInfo {
  proposals: DeriveCollectiveProposal[];
  proposalInfo: any[];
  accountInfo: DeriveAccountInfo[]
}

export interface ChainInfo {
  api: ApiPromise;
  coin: string;
  decimals: number;
  url: string;
  genesisHash: string;
  chainName?: string;
}

export interface ProposalsInfo {
  proposals: DeriveProposal[];
  accountsInfo: DeriveAccountInfo[];
  minimumDeposit?: string;
}

export interface Conviction {
  text: string;
  value: number
}

type TransactionType = 'chill' | 'bond' | 'unbond' | 'nominate' | 'bondExtra' | 'slashingSpans' | 'withdrawUnbonded';

export interface TransactionFee {
  transactionType: TransactionType;
  estimatedFee: Balance;
}

export interface Referendum extends DeriveReferendumExt {
  proposerInfo: DeriveAccountInfo;
}

export interface RebagInfo {
  shouldRebag: boolean;
  currentUpper?: string,
  currentWeight?: string,
}

export interface PutInFrontInfo {
  shouldPutInFront?: boolean;
  lighter?: string;
}

export interface AddressState {
  genesisHash: string;
  address: string;
}
export interface FormattedAddressState {
  genesisHash: string;
  address: string;
  formatted: string;
  assetId: string;
}

export interface nameAddress {
  name?: string;
  address: string;
}
export interface NameAddress {
  name?: string;
  address: string;
}

interface Judgment {
  index: number;
  judgement: string;
}

interface AccountInfo {
  address: string;
  display: string;
  judgements: Judgment[] | null;
  account_index: string;
  identity: boolean;
  parent: string | null
}

export interface Tip {
  block_num: number;
  reason: string;
  hash: string;
  extrinsic_index: string;
  status: string;
  amount: string;
  close_block_num: number;
  tipper_num: number;
  finder: AccountInfo;
  beneficiary: AccountInfo;
}

export interface PoolStakingConsts {
  eraIndex: number;
  lastPoolId: BN;
  maxPoolMembers: number;
  maxPoolMembersPerPool: number;
  maxPools: number;
  minCreateBond: BN;
  minCreationBond: BN
  minJoinBond: BN;
  minNominatorBond: BN;
  token: string;
}

export interface PoolInfo {
  poolId: number;
  bondedPool: PalletNominationPoolsBondedPoolInner | null;
  metadata: string | null;
  rewardPool: PalletNominationPoolsRewardPool | null;
  identity?: Identity;
  stashIdAccount?: DeriveStakingAccount;
}

export interface MyPoolInfo extends PoolInfo {
  member?: PalletNominationPoolsPoolMember;
  accounts?: PoolAccounts;
  myClaimable?: BN;
  redeemable?: BN;
  rewardClaimable?: BN;
  rewardIdBalance?: DeriveStakingAccount;
  token?: string;
  decimal?: number;
  date?: number;
}

export interface PoolAccounts {
  rewardId: string;
  stashId: string;
}

export interface MembersMapEntry {
  accountId: string;
  member: PalletNominationPoolsPoolMember;
}

export interface RecoveryConsts {
  configDepositBase: BN;
  friendDepositFactor: BN;
  maxFriends: number;
  recoveryDeposit: BN
}

export interface Rescuer extends DeriveAccountInfo {
  option?: {
    created: BN,
    deposit: BN,
    friends: string[]
  }
}

export interface Voucher {
  blockNumber: string;
  friend: string;
  id: string;
  lost: string;
  rescuer: string;
}

export interface Initiation {
  blockNumber: string;
  id: string;
  lost: string;
  rescuer: string;
}

export type Close = Initiation;

interface Reward {
  era: number,
  stash: string,
  amount: string,
  eventIdx: number,
  isReward: boolean,
  validator: string
}

interface Transfer {
  to: string,
  fee: string,
  from: string,
  amount: string,
  success: boolean,
  eventIdx: number
}

interface extrinsic {
  fee: string,
  call: string,
  hash: string,
  module: string,
  success: boolean
}
export interface SubQueryRewardInfo {
  blockNumber: number,
  timestamp: string,
  extrinsicHash: string,
  address: string,
  reward: Reward
}
export interface SubQueryHistory {
  action(action: any): unknown;
  id: string,
  blockNumber: number,
  extrinsicIdx: number,
  extrinsicHash: string,
  timestamp: string,
  address: string,
  reward: Reward,
  extrinsic: extrinsic,
  transfer: Transfer,
  assetTransfer: JSON,
}

export interface SubscanRewardInfo {
  era: number,
  stash: string,
  account: string,
  validator_stash: string,
  amount: string,
  block_timestamp: number,
  event_index: string,
  module_id: string,
  event_id: string,
  slash_kton: string,
  extrinsic_index: string
}

export interface RewardInfo {
  era: number;
  amount: BN;
  date?: string;
  timeStamp: number;
  event: string;
  validator: string;
  stash: string
}

export interface SubscanClaimedRewardInfo {
  era: number,
  pool_id: number,
  account_display: { address: string },
  amount: string,
  block_timestamp: number,
  event_index: string,
  module_id: string,
  event_id: string,
  extrinsic_index: string
}

export interface ClaimedRewardInfo {
  era: number;
  amount: BN;
  date?: string;
  timeStamp: number;
}

export type ProxyTypes = 'Any' | 'Auction' | 'CancelProxy' | 'IdentityJudgement' | 'Governance' | 'NonTransfer' | 'Staking' | 'SudoBalances' | 'Society' | 'NominationPools';

export interface Proxy {
  delay: number;
  delegate: string;
  proxyType: ProxyTypes;
  isAvailable?: boolean;
}

export interface ProxyItem {
  proxy: Proxy;
  status: 'current' | 'new' | 'remove';
}

export interface RenameAcc {
  address: string;
  name: string;
  genesisHash: string;
}

export interface AccountMenuInfo {
  account: AccountJson | null;
  chain: Chain | null;
  formatted: string;
  type: KeypairType;
}

export interface Recoded {
  account: AccountJson | null;
  formatted: string | null;
  genesisHash?: string | null;
  prefix?: number;
  type: KeypairType;
}

export interface TransferTxInfo {
  amount: string;
  api: ApiPromise;
  block: number;
  chain: Chain;
  from: NameAddress;
  txHash: string;
  to: NameAddress;
  throughProxy: NameAddress | null;
  failureText: string;
  fee: Balance;
  status: string;
  token: string;
}

export interface Step {
  current: string | number;
  total: string | number;
  style?: SxProps<Theme> | undefined;
}

interface PriceValue {
  value: number,
  change: number
}

export interface PricesType {
  [priceId: string]: PriceValue;
}

export interface Prices {
  date: number;
  prices: PricesType;
  currencyCode?: string;
}

export interface PricesInCurrencies {
  [currencyCode: string]: { date: number; prices: PricesType; };
}

export interface Price {
  price: number;
  priceChainName: string;
  priceDate: number;
}

export interface SavedBalances {
  [chainName: string]: {
    balances: Record<string, string>;
    decimal: number;
    token: string;
    date: number;
  }
}

export interface SavedIdentities {
  [chainName: string]: DeriveAccountRegistration;
}

export interface BalancesInfo extends DeriveBalancesAll {
  ED: BN;
  assetId?: number;
  chainName: string;
  currencyId?: unknown;
  date: number;
  decimal: number;
  genesisHash: string;
  pooledBalance?: BN;
  frozenBalance: BN;
  soloTotal?: BN;
  token: string;
  totalBalance?: number;
}
export interface AccountStakingInfo extends DeriveStakingAccount {
  era: number;
  decimal?: number;
  token?: string;
  date?: number;
  genesisHash?: string;
}
export interface MemberPoints {
  accountId: string;
  points: BN;
}

export interface Fetching {
  [formatted: string]: IsFetching;
}

export interface IsFetching {
  [item: string]: boolean;
}

export interface UserAddedEndpoint {
  chain: string;
  color: string;
  endpoint: string;
  priceId: string;
}

export type UserAddedChains= Record<string, UserAddedEndpoint>

export interface CurrencyContextType {
  currency: CurrencyItemType | undefined;
  setCurrency: (selectedCurrency: CurrencyItemType) => void;
}

export interface FetchingRequests {
  fetching: Fetching;
  set: (change: Fetching) => void;
}
interface Limit {
  check?: boolean;
  value?: number;
}
export interface Filter {
  withIdentity: boolean;
  noWaiting: boolean;
  noOversubscribed: boolean;
  noSlashed: boolean;
  maxCommission: Limit;
  limitOfValidatorsPerOperator: Limit;
  sortBy: string;
}
export interface PoolFilter {
  hasNominated: Limit;
  hasVerifiedIdentity: boolean;
  stakedMoreThan: Limit;
  membersMoreThan: Limit;
  sortBy: string;
}
export interface ValidatorInfoWithIdentity extends ValidatorInfo {
  identity?: DeriveAccountRegistration;
}

export interface ApiState {
  apiDefaultTx: SubmittableExtrinsicFunction;
  apiDefaultTxSudo: SubmittableExtrinsicFunction;
  // hasInjectedAccounts: boolean;
  isApiReady: boolean;
  isDevelopment: boolean;
  isEthereum: boolean;
  specName: string;
  specVersion: string;
  systemChain: string;
  systemName: string;
  systemVersion: string;
}

export interface ApiProps extends ApiState {
  api: ApiPromise;
  apiEndpoint: LinkOption | null;
  apiError: string | null;
  apiRelay: ApiPromise | null;
  apiUrl?: string;
  extensions?: InjectedExtension[];
  isApiConnected: boolean;
  isApiInitialized: boolean;
  isElectron: boolean;
  isWaitingInjected: boolean;
}

export interface ApiPropsNew {
  api?: ApiPromise;
  endpoint: string;
  isRequested: boolean;
}

export type APIs = Record<string, ApiPropsNew[] | undefined>;

export interface APIsContext {
  apis: APIs;
  setIt: (apis: APIs) => void;
}

export interface LatestRefs {
  [key: string]: LatestReferenda[]
}

export interface ReferendaContextType {
  refs: LatestRefs;
  setRefs: (refs: LatestRefs) => void;
}

export interface AccountAssets {
  assetId: number | undefined;
  chainName: string;
  decimal: number;
  price?: number;
  priceId: string;
  genesisHash: string;
  token: string;
  totalBalance: BN;
}

export interface AccountsAssets {
  address: string;
  assets: AccountAssets[];
}

export interface SavedAccountsAssets { balances: AccountsAssets[], timestamp: number }

export interface AccountsAssetsContextType {
  accountsAssets: SavedAssets | null | undefined;
  setAccountsAssets: (savedAccountAssets: SavedAssets) => void;
}

export type Severity= 'error' | 'warning' | 'info' | 'success'

export interface AlertType {
  id: string;
  text: string;
  severity: Severity
}

export interface AlertContextType {
  alerts: AlertType[];
  setAlerts: React.Dispatch<React.SetStateAction<AlertType[]>>;
}

// TODO: FixMe, Controller is deprecated
export interface PayeeAccount { Account: string }
export type Payee = 'Staked' | 'Controller' | 'Stash' | PayeeAccount;
export interface SoloSettings {
  controllerId?: string | undefined,
  payee: Payee,
  stashId?: string | undefined,
}

export interface DropdownOption {
  text: string;
  value: string | number;
}

export type TransferType = 'All' | 'Max' | 'Normal';

export interface CanPayFee { isAbleToPay: boolean | undefined, statement: number }

export interface ProxiedAccounts {
  genesisHash: string;
  proxy: string;
  proxied: string[];
}

export interface AccountsOrder {
  id: number,
  account: AccountWithChildren
}

export interface EndpointType {
  checkForNewOne?: boolean;
  endpoint: string | undefined;
  timestamp: number | undefined;
  isAuto: boolean | undefined;
}

export interface FastestConnectionType {
  api: ApiPromise | undefined;
  selectedEndpoint: string | undefined;
}

export type RecentChainsType = Record<string, string[]>;
