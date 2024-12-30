// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Option, StorageKey } from '@polkadot/types';
import type { Balance } from '@polkadot/types/interfaces';
// @ts-ignore
import type { PalletSocietyBid, PalletSocietyCandidacy } from '@polkadot/types/lookup';
import type { AnyTuple, Codec } from '@polkadot/types-codec/types';
import type { Proxy } from '../util/types';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { BN, BN_ZERO } from '@polkadot/util';

import { ASSET_HUBS, PROXY_CHAINS } from '../util/constants';
import useActiveRecoveries from './useActiveRecoveries';
import { useInfo } from '.';

type Item = 'identity' | 'proxy' | 'bounty' | 'recovery' | 'referenda' | 'index' | 'society' | 'multisig' | 'preimage' | 'assets' | 'uniques' | 'NFT';
export type Reserved = { [key in Item]?: Balance | null };

export default function useReservedDetails (address: string | undefined): Reserved {
  const { api, decimal, formatted, genesisHash } = useInfo(address);
  const activeRecoveries = useActiveRecoveries(api);
  const [reserved, setReserved] = useState<Reserved>({});

  const activeLost = useMemo(() =>
    activeRecoveries && formatted
      ? activeRecoveries.filter((active) => active.lost === String(formatted)).at(-1) ?? null
      : activeRecoveries === null
        ? null
        : undefined
  , [activeRecoveries, formatted]);

  const toBalance = useCallback((value: BN) => {
    if (!api) {
      return undefined;
    }

    return api.createType('Balance', value) as unknown as Balance;
  }, [api]);

  const setValue = useCallback((item: Item, value: BN | null | undefined) => {
    setReserved((prev) => {
      const newState = { ...prev };

      newState[item] = value
        ? value.isZero() ? null : toBalance(value)
        : value;

      return newState;
    });
  }, [toBalance]);

  useEffect(() => {
    if (!api || !genesisHash) {
      return;
    }

    try {
      // TODO: needs to incorporate people chain?
      /** fetch identity  */
      api.query?.['identity']?.['identityOf'](formatted).then(async (id) => {
        setValue('identity', undefined);
        const basicDeposit = api.consts['identity']['basicDeposit'] as unknown as BN;
        // const subAccountDeposit = api.consts['identity']['subAccountDeposit'] as unknown as BN;

        const subs = await api.query['identity']['subsOf'](formatted) as unknown as BN[];

        const subAccountsDeposit = (subs ? subs[0] : BN_ZERO) as unknown as BN;

        const sum = (basicDeposit.add(subAccountsDeposit)) as unknown as BN;

        if (!id.isEmpty) {
          setValue('identity', sum);
        } else {
          setValue('identity', null);
        }
      }).catch((error) => {
        console.error(error);
        setValue('identity', null);
      });

      /** fetch proxy  */
      if (api.query?.['proxy'] && PROXY_CHAINS.includes(genesisHash)) {
        setValue('proxy', undefined);

        api.query['proxy']['proxies'](formatted).then((proxyInformation) => {
          type ProxiesInformation = [Proxy[], number];

          const proxiesInformation = proxyInformation.toPrimitive() as ProxiesInformation;

          const maybeDeposit = proxiesInformation?.[1];

          if (maybeDeposit !== 0) {
            setValue('proxy', new BN(maybeDeposit));
          } else {
            setValue('proxy', null);
          }
        }).catch((error) => {
          console.error(error);
          setValue('proxy', null);
        });
      }

      /** fetch social recovery  */
      if (api.query?.['recovery']) {
        setValue('recovery', undefined);

        api.query['recovery']['recoverable'](formatted).then((r) => {
          interface RecoveryType {
            delayPeriod: number;
            deposit: number;
            threshold: number;
            friends: string[];
          }

          const recoveryInfo = r.isEmpty ? null : r.toPrimitive() as unknown as RecoveryType;

          if (!recoveryInfo) {
            setValue('recovery', null);

            return;
          }

          const recoveryDeposit = (new BN(recoveryInfo.deposit)).add(activeLost?.deposit || BN_ZERO);

          setValue('recovery', recoveryDeposit);
        }).catch((error) => {
          console.error(error);
          setValue('recovery', null);
        });
      } else {
        setValue('recovery', null);
      }

      /** Fetch referenda  */
      if (api.query?.['referenda']?.['referendumInfoFor']) {
        setValue('referenda', undefined);

        interface ReferendaDeposit {
          who: string;
          amount: number;
        }

        interface Referenda {
          approved?: [number, null, null];
          timedOut?: [number, ReferendaDeposit, null];
          rejected?: [number, ReferendaDeposit, null];
          cancelled?: [number, ReferendaDeposit, null];
          ongoing?: { submissionDeposit: ReferendaDeposit, decisionDeposit: ReferendaDeposit };
        }

        let referendaDepositSum = BN_ZERO;

        api.query['referenda']['referendumInfoFor'].entries().then((referenda) => {
          referenda.forEach(([_, value]) => {
            if (!value.isEmpty) {
              // @ts-ignore
              const ref = value.toPrimitive() as Referenda;

              if (!ref || 'approved' in ref) {
                return;
              }

              if (ref.timedOut || ref.rejected || ref.cancelled) {
                const who = ref?.timedOut?.[1]?.who || ref?.rejected?.[1]?.who || ref?.cancelled?.[1]?.who;

                if (who === formatted) {
                  const amount = ref?.timedOut?.[1]?.amount ?? ref?.rejected?.[1]?.amount ?? ref?.cancelled?.[1]?.amount ?? 0;

                  referendaDepositSum = referendaDepositSum.add(new BN(amount));
                }
              }

              if (ref.ongoing) {
                if (ref.ongoing.submissionDeposit && ref.ongoing.submissionDeposit.who === formatted) {
                  referendaDepositSum = referendaDepositSum.add(new BN(ref.ongoing.submissionDeposit.amount));
                }

                if (ref.ongoing.decisionDeposit && ref.ongoing.decisionDeposit.who === formatted) {
                  referendaDepositSum = referendaDepositSum.add(new BN(ref.ongoing.decisionDeposit.amount));
                }
              }

              // if (info?.submissionDeposit && info.submissionDeposit.who.toString() === formatted) {
              //   referendaDepositSum = referendaDepositSum.add(info.submissionDeposit.amount);
              // }

              // if (info?.decisionDeposit?.isSome) {
              //   const decisionDeposit = info?.decisionDeposit.unwrap();

              //   if (decisionDeposit.who.toString() === formatted) {
              //     referendaDepositSum = referendaDepositSum.add(decisionDeposit.amount);
              //   }
              // }
            }
          });

          setValue('referenda', referendaDepositSum);
        }).catch((error) => {
          console.error(error);
          setValue('referenda', null);
        });
      } else {
        setValue('referenda', null);
      }

      /** Fetch bounties  */
      if (api.query?.['bounties']?.['bounties']) {
        setValue('bounty', undefined);

        let sum = BN_ZERO;

        api.query['bounties']['bounties'].entries().then((bounties) => {
          bounties.forEach(([_, value]) => {
            if (!value.isEmpty && decimal) {
              interface Bounty {
                bond: number;
                curatorDeposit: number;
                fee: number;
                proposer: string;
                value: number;
                status: {
                  active: {
                    curator: string;
                    updateDue: number;
                  };
                };
              }
              const bounty = value.toPrimitive() as unknown as Bounty;

              if (bounty.proposer.toString() === formatted) {
                sum = sum.add(new BN(bounty.curatorDeposit));
              }
            }
          });

          setValue('bounty', sum);
        }).catch((error) => {
          console.error(error);
          setValue('bounty', null);
        });
      } else {
        setValue('bounty', null);
      }

      /** Fetch indices  */
      if (api.query?.['indices']?.['accounts']) {
        setValue('index', undefined);

        let sum = BN_ZERO;

        api.query['indices']['accounts'].entries().then((indices) => {
          indices.forEach(([_, value]) => {
            if (!value.isEmpty) {
              const [address, deposit, _status] = value.toPrimitive() as [string, number, boolean];

              if (address.toString() === formatted) {
                sum = sum.add(new BN(deposit));
              }
            }
          });

          setValue('index', sum);
        }).catch((error) => {
          console.error(error);
          setValue('index', null);
        });
      } else {
        setValue('index', null);
      }

      /** Fetch multisig  */
      if (api.query?.['multisig']) {
        setValue('multisig', undefined);

        let sum = BN_ZERO;

        api.query['multisig']['multisigs'].entries().then((multisigs) => {
          multisigs.forEach(([_, value]) => {
            if (!value.isEmpty) {
              const { deposit, depositor } = value.toPrimitive() as { deposit: number, depositor: string };

              if (depositor === formatted) {
                sum = sum.add(new BN(deposit));
              }
            }
          });

          setValue('multisig', sum);
        }).catch((error) => {
          console.error(error);
          setValue('multisig', null);
        });
      } else {
        setValue('multisig', null);
      }

      /** Fetch preImage  */
      if (api.query?.['preimage']?.['requestStatusFor']) {
        setValue('preimage', undefined);

        interface Preimage {
          unrequested?: {
            len: number;
            ticket: [string, number]; // address, amount
            deposit?: [string, number] | null; // address, amount (for old preimage)
          };
          requested?: {
            maybeTicket: [string, number]; // address, amount
            deposit?: [string, number] | null; // address, amount (for old preimage)
          } | null;
        }

        const calculatePreimageDeposit = (preimages: [StorageKey<AnyTuple>, Codec][] | undefined, formatted: string): BN => {
          let sum = new BN(0);

          if (!preimages) {
            return sum;
          }

          preimages.forEach(([_, value]) => {
            if (value.isEmpty) {
              return;
            }

            const status = value.toPrimitive() as unknown as Preimage;

            // Helper function to add deposit if account matches
            const addDepositIfMatched = (ticket: [string, number] | null | undefined) => {
              if (!ticket) {
                return;
              }

              const [accountId, deposit] = ticket;

              if (accountId === formatted) {
                sum = sum.add(new BN(deposit));
              }
            };

            // Check unrequested and requested preimage statuses
            addDepositIfMatched(status?.unrequested?.ticket);
            addDepositIfMatched(status?.requested?.maybeTicket);
            addDepositIfMatched(status?.unrequested?.deposit);
            addDepositIfMatched(status?.requested?.deposit);
          });

          return sum;
        };

        const fetchPreimageDeposits = async () => {
          if (!formatted) {
            return;
          }

          try {
            // Fetch both new and old preimage entries
            const [newPreimage, oldPreimage] = await Promise.all([
              api.query['preimage']['requestStatusFor'].entries(),
              api.query['preimage']['statusFor'].entries()
            ]);

            // Calculate deposits for both new and old preimages
            const totalSum = calculatePreimageDeposit(newPreimage, formatted).add(calculatePreimageDeposit(oldPreimage, formatted));

            setValue('preimage', totalSum);
          } catch (error) {
            console.error(error);
            setValue('preimage', null);
          }
        };

        fetchPreimageDeposits()
          .catch((error) => {
            console.error(error);
            setValue('preimage', null);
          });
      } else {
        setValue('preimage', null);
      }

      /** Fetch society  */
      if (api.query?.['society']) {
        setValue('society', undefined);

        let sum = BN_ZERO;

        api.query['society']['bids']().then(async (bids) => {
          (bids as unknown as PalletSocietyBid[]).forEach(({ kind, who }) => {
            if (who.toString() === formatted) {
              const deposit = kind.isDeposit ? kind.asDeposit : BN_ZERO;

              sum = sum.add(deposit);
            }
          });

          const candidates = await api.query['society']['candidates'](formatted) as Option<PalletSocietyCandidacy>;

          if (candidates.isSome) {
            const { kind } = candidates.unwrap();
            const deposit = kind.isDeposit ? kind.asDeposit : BN_ZERO;

            sum = sum.add(deposit);
          }

          setValue('society', sum);
        }).catch((error) => {
          console.error(error);
          setValue('society', null);
        });
      } else {
        setValue('society', null);
      }

      /** assets on asset hubs */
      if (api.consts?.['assets'] && ASSET_HUBS.includes(genesisHash)) {
        setValue('assets', undefined);

        api.query['assets']['asset'].entries().then(async (assets) => {
          interface Assets {
            deposit: number;
            owner: string;
          }

          const myAssets = assets.filter(([_id, asset]) => {
            if (asset.isEmpty || _id.isEmpty) {
              return false;
            }

            const assetInPrimitive = asset.toPrimitive() as unknown as Assets;

            return assetInPrimitive.owner === formatted;
          });

          if (myAssets.length === 0) {
            setValue('assets', null);

            return;
          }

          const myAssetsId = myAssets.map(([assetId, _]) => {
            const assetIdInHuman = assetId.toHuman() as string[];

            return assetIdInHuman[0].replaceAll(',', '');
          });
          const assetDeposit = api.consts['assets']['assetDeposit'] as unknown as BN;

          interface AssetMetadata {
            decimals: number;
            deposit: number;
            isFrozen: boolean;
          }

          const myAssetsMetadata = await Promise.all(myAssetsId.map((assetId) => api.query['assets']['metadata'](assetId))) as unknown as (AssetMetadata | undefined)[];

          const totalAssetDeposit = myAssetsMetadata.reduce((acc, metadata) => {
            return acc.add(metadata?.deposit ? new BN(metadata?.deposit) : BN_ZERO);
          }, BN_ZERO);

          const finalDeposit = totalAssetDeposit.add(assetDeposit.muln(myAssetsId.length));

          setValue('assets', finalDeposit);
        }).catch((error) => {
          console.error(error);
          setValue('assets', null);
        });
      } else {
        setValue('assets', null);
      }

      /** nft */
      // if (api.query?.['nfts']) {
      //   setValue('NFT', undefined);

      //   api.query['nfts']['collection'].entries().then(async (collections) => {
      //     interface Collection {
      //       owner: string;
      //       ownerDeposit: number;
      //       items: number;
      //       itemMetadatas: number;
      //       itemConfigs: number;
      //       attributes: number;
      //     }

      //     const my = collections.filter(([_, collection]) => {
      //       if (collection.isEmpty) {
      //         return false;
      //       }

      //       const collectionInPrimitive = collection.toPrimitive() as unknown as Collection;

      //       return collectionInPrimitive.owner === formatted;
      //     });

      //     const myCollections = my.map(([_, collection]) => collection.toPrimitive() as unknown as Collection);

      //     console.log('myCollections :::', my.map(([id, collection]) => [id.toHuman(), collection.toPrimitive() as unknown as Collection]));

      //     const totalCollectionDeposit = myCollections.reduce((acc, collectionInformation) => {
      //       if (!collectionInformation.ownerDeposit) {
      //         return acc.add(BN_ZERO);
      //       }

      //       return acc.add(new BN(collectionInformation.ownerDeposit));
      //     }, BN_ZERO);

      //     // ATTRIBUTES
      //     const attributeDepositBase = api.consts['nfts']['attributeDepositBase'] as unknown as BN;
      //     const totalCollectionsAttribute = myCollections.reduce((acc, { attributes }) => {
      //       return acc + attributes;
      //     }, 0);

      //     const totalAttributesDeposit = attributeDepositBase.muln(totalCollectionsAttribute);

      //     interface NFTInformation {
      //       deposit: {
      //         account: string;
      //         amount: number;
      //       },
      //       owner: string;
      //     }

      //     const nft = await api.query['nfts']['item'].entries();

      //     const myNFTs = nft.filter(([nftId, nftInfo]) => {
      //       if (nftInfo.isEmpty || nftId.isEmpty) {
      //         return false;
      //       }

      //       const nftInformation = nftInfo.toPrimitive() as unknown as NFTInformation;

      //       return nftInformation.deposit.account === formatted;
      //     }).map(([id, nftInfo]) => {
      //       const nftInformation = nftInfo.toPrimitive() as unknown as NFTInformation;
      //       const nftId = id.toHuman() as [string, string]; // [collectionId, nftId]

      //       nftId.forEach((value, index) => {
      //         nftId[index] = value.replaceAll(/,/g, '');
      //       });

      //       return { nftId, nftInformation };
      //     });

      //     console.log('myNFTs :::', myNFTs);

      //     const totalItemDeposit = myNFTs.reduce((acc, { nftInformation }) => {
      //       return acc.add(new BN(nftInformation.deposit.amount));
      //     }, BN_ZERO);

      //     setValue('NFT', totalCollectionDeposit.add(totalItemDeposit).add(totalAttributesDeposit));
      //   }).catch((error) => {
      //     console.error(error);
      //     setValue('NFT', null);
      //   });
      // } else {
      //   setValue('NFT', null);
      // }

      /** uniques */
      // if (api.query?.['uniques']) {
      //   setValue('uniques', undefined);

      //   interface Unique {
      //     admin: string;
      //     attributes: number;
      //     freeHolding: boolean;
      //     freezer: string;
      //     isFrozen: boolean;
      //     issuer: string;
      //     itemMetadatas: number;
      //     items: number;
      //     owner: string;
      //     totalDeposit: number;
      //   }

      //   api.query['uniques']['class'].entries().then((classes) => {
      //     const myClasses = classes.filter(([_, uniqueInfo]) => {
      //       const uniqueInfoInPrimitive = uniqueInfo.toPrimitive() as unknown as Unique;

      //       return uniqueInfoInPrimitive.owner === formatted;
      //     })
      //       .map(([_, uniquesInfo]) => uniquesInfo.toPrimitive() as unknown as Unique);

      //     console.log('myClasses:', myClasses);

      //     const totalClassesDeposit = myClasses.reduce((acc, { totalDeposit }) => acc.add(new BN(totalDeposit)), BN_ZERO);

      //     setValue('uniques', totalClassesDeposit);
      //   }).catch((error) => {
      //     console.error(error);
      //     setValue('uniques', null);
      //   });
      // } else {
      //   setValue('uniques', null);
      // }
    } catch (e) {
      console.error('Fatal error while fetching reserved details:', e);
    }
  }, [activeLost?.deposit, api, decimal, formatted, genesisHash, setValue]);

  useEffect(() => {
    setReserved({});
  }, [address, genesisHash]);

  return reserved;
}
