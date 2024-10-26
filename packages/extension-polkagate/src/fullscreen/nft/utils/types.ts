// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type React from 'react';
import type { ApiPromise } from '@polkadot/api';
import type { Chain } from '@polkadot/extension-chains/types';
import type { BN } from '@polkadot/util';

export interface ItemInformation {
  collectionId?: string;
  chainName: string; // polkadot, kusama or westend asset hubs
  itemId?: string;
  data?: string;
  isNft: boolean;
  isCollection: boolean;
  creator?: string | undefined;
  owner: string;
  price?: BN | null | undefined;
  items?: number;
}

export interface FilterSectionProps {
  items: ItemInformation[] | null | undefined;
  setItemsToShow: React.Dispatch<React.SetStateAction<ItemInformation[] | null | undefined>>;
}

export interface CheckboxButtonProps {
  title: string;
  checked: boolean;
  disabled: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void;
}

interface Attribute { label: string; value: string }

export interface ItemMetadata {
  animation_url?: string | null;
  name?: string | undefined;
  description?: string | undefined;
  image?: string | null | undefined;
  attributes: Attribute[] | undefined;
  tags: string[] | undefined;
  metadataLink: string;
  imageContentType?: string;
  animationContentType?: string;
  mediaUri?: string;
}

export type ItemsDetail = Record<string, ItemMetadata | null | undefined>;

export interface ThumbnailProps {
  itemInformation: ItemInformation | undefined;
  itemsDetail: ItemsDetail;
  api: ApiPromise | undefined;
}

export interface ItemAvatarProp {
  image: string | null | undefined;
  onFullscreen?: () => void;
  size?: 'small' | 'large';
}

export interface FullscreenNftModalProps {
  source: string | null | undefined;
  onClose: () => void;
  iFrame?: boolean;
  open: boolean;
}

export interface DetailsProp {
  api: ApiPromise | undefined;
  details: ItemMetadata | null;
  itemInformation: ItemInformation;
  show: boolean;
  setShowDetail: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface DetailProp {
  title?: string;
  text?: string;
  inline?: boolean;
  isThumbnail?: boolean;
  accountId?: string;
  api?: ApiPromise;
  chain?: Chain | null;
  price?: BN | null;
  divider?: boolean;
  link?: string;
  linkName?: string;
}

export interface ItemsListProps {
  nfts: ItemInformation[] | null | undefined;
  itemsDetail: ItemsDetail;
  apis: Record<string, ApiPromise | undefined>;
}

export interface DataType {
  url: string;
  contentType?: string | undefined;
}

export type NftsPrices = [number, string | null] | null;

export interface DetailItemProps {
  animation_url: string | null | undefined;
  animationContentType: string | undefined;
  imageContentType: string | undefined;
  image: string | null | undefined;
  setShowFullscreenDisabled: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface AudioPlayerProps {
  audioUrl: string | undefined;
}