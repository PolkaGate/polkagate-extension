// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import type { TransitionProps } from '@mui/material/transitions';
import type { HexString } from '@polkadot/util/types';

import { faAddressCard, faGem } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Close as CloseIcon } from '@mui/icons-material';
import { Dialog, Divider, Grid, IconButton, Slide, useTheme } from '@mui/material';
import React, { useCallback, useContext, useState } from 'react';

import { ActionContext, GenesisHashOptionsContext, Identity, MenuItem, RemoteNodeSelector, SelectChain, SocialRecoveryIcon, VaadinIcon } from '../components';
import ProfileMenu from '../fullscreen/homeFullScreen/partials/ProfileMenu';
import { useInfo, useTranslation } from '../hooks';
import { tieAccount, windowOpen } from '../messaging';
import { IDENTITY_CHAINS, PROXY_CHAINS, SOCIAL_RECOVERY_CHAINS } from '../util/constants';
import getLogo from '../util/getLogo';

interface Props {
  setShowMenu: React.Dispatch<React.SetStateAction<boolean>>;
  isMenuOpen: boolean;
  address: string;
}

const Transition = React.forwardRef(function Transition (props: TransitionProps & { children: React.ReactElement<unknown>; }, ref: React.Ref<unknown>) {
  return <Slide direction='up' ref={ref} {...props} />;
});

const MenuSeparator = () => <Divider sx={{ bgcolor: 'divider', height: '1px', my: '3px' }} />;

function AccountMenu ({ address, isMenuOpen, setShowMenu }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const theme = useTheme();
  const options = useContext(GenesisHashOptionsContext);

  const { account, api, chain, formatted, genesisHash: currentGenesisHash } = useInfo(address);

  const [genesisHash, setGenesis] = useState<string | undefined>();

  const onAction = useContext(ActionContext);
  const hasPrivateKey = !(account?.isExternal || account?.isHardware);

  const onForgetAccount = useCallback(() => {
    onAction(`/forget/${address}/${account?.isExternal}`);
  }, [address, account, onAction]);

  const onDeriveAccount = useCallback(() => {
    address && onAction(`/derive/${address}/locked`);
  }, [address, onAction]);

  const closeMenu = useCallback(() =>
    setShowMenu((isMenuOpen) => !isMenuOpen)
  , [setShowMenu]);

  const onChangeNetwork = useCallback((newGenesisHash: string) => {
    const availableGenesisHash = newGenesisHash.startsWith('0x') ? newGenesisHash : null;

    address && tieAccount(address, availableGenesisHash as HexString).catch(console.error);
    setGenesis(availableGenesisHash ?? undefined);
  }, [address]);

  const onRenameAccount = useCallback(() => {
    address && onAction(`/rename/${address}`);
  }, [address, onAction]);

  const onExportAccount = useCallback(() => {
    address && onAction(`/export/${address}`);
  }, [address, onAction]);

  const onManageProxies = useCallback(() => {
    address && currentGenesisHash && PROXY_CHAINS.includes(currentGenesisHash) && onAction(`/manageProxies/${address}`);
  }, [address, currentGenesisHash, onAction]);

  const onManageId = useCallback(() => {
    address && windowOpen(`/manageIdentity/${address}`).catch(console.error);
  }, [address]);

  const onSocialRecovery = useCallback(() => {
    address && windowOpen(`/socialRecovery/${address}/false`).catch(console.error);
  }, [address]);

  const onNFTAlbum = useCallback(() => {
    address && windowOpen(`/nft/${address}`).catch(console.error);
  }, [address]);

  const isDisabled = useCallback((supportedChains: string[]) => {
    if (!currentGenesisHash) {
      return true;
    }

    return !supportedChains.includes(currentGenesisHash);
  }, [currentGenesisHash]);

  const vaadinIconStyle = { color: `${theme.palette.text.primary}`, height: '18px' };

  return (
    <Dialog
      PaperProps={{
        sx: {
          backgroundImage: 'unset',
          bgcolor: 'transparent',
          boxShadow: 'unset'
        }
      }}
      TransitionComponent={Transition}
      componentsProps={{
        backdrop: {
          sx: {
            backdropFilter: 'blur(5px)',
            bgcolor: 'transparent'
          }
        }
      }}
      fullScreen
      open={isMenuOpen}
    >
      <Grid bgcolor='transparent' container height='100%' width='357px' zIndex={10}>
        <Grid alignItems='flex-start' bgcolor='background.default' container display='block' item mt='46px' px='46px' sx={{ borderRadius: '10px 10px 0px 0px', boxShadow: '0px 0px 10px rgba(255, 255, 255, 0.25)', height: 'parent.innerHeight' }} width='100%'>
          <Grid container item justifyContent='center' my='8px'>
            <Identity address={address} api={api} chain={chain} formatted={formatted} identiconSize={30} showSocial={false} style={{ fontSize: '22px' }} subIdOnly />
          </Grid>
          <MenuSeparator />
          <MenuItem
            disabled={isDisabled(IDENTITY_CHAINS)}
            fontSize='16px'
            iconComponent={
              <FontAwesomeIcon
                color={isDisabled(IDENTITY_CHAINS) ? theme.palette.text.disabled : theme.palette.text.primary}
                fontSize={19}
                icon={faAddressCard}
              />
            }
            onClick={onManageId}
            text={t('Manage identity')}
            withHoverEffect
          />
          <MenuItem
            disabled={isDisabled(PROXY_CHAINS)}
            fontSize='16px'
            iconComponent={
              <VaadinIcon icon='vaadin:sitemap' style={{ color: `${isDisabled(PROXY_CHAINS) ? theme.palette.text.disabled : theme.palette.text.primary}`, height: '18px' }} />
            }
            onClick={onManageProxies}
            text={t('Manage proxies')}
            withHoverEffect
          />
          <MenuItem
            disabled={isDisabled(SOCIAL_RECOVERY_CHAINS)}
            fontSize='16px'
            iconComponent={
              <SocialRecoveryIcon
                color={
                  isDisabled(SOCIAL_RECOVERY_CHAINS)
                    ? theme.palette.text.disabled
                    : theme.palette.text.primary}
                height={22}
                width={22}
              />
            }
            onClick={onSocialRecovery}
            text={t('Social recovery')}
            withHoverEffect
          />
          <MenuItem
            disabled={false} // We check NFTs across all supported chains, so this feature is not specific to the current chain and should not be disabled.
            fontSize='16px'
            iconComponent={
              <FontAwesomeIcon
                color={theme.palette.text.primary}
                fontSize='22px'
                icon={faGem}
              />
            }
            onClick={onNFTAlbum}
            text={t('NFT album')}
            withHoverEffect
          />
          <MenuSeparator />
          <ProfileMenu
            address={address}
            closeParentMenu={closeMenu}
          />
          <MenuSeparator />
          {hasPrivateKey &&
            <MenuItem
              fontSize='16px'
              iconComponent={
                <VaadinIcon icon='vaadin:download-alt' style={vaadinIconStyle} />
              }
              onClick={onExportAccount}
              text={t('Export account')}
              withHoverEffect
            />}
          {hasPrivateKey &&
            <MenuItem
              fontSize='16px'
              iconComponent={
                <VaadinIcon icon='vaadin:road-branch' style={vaadinIconStyle} />
              }
              onClick={onDeriveAccount}
              text={t('Derive new account')}
              withHoverEffect
            />
          }
          <MenuItem
            fontSize='16px'
            iconComponent={
              <VaadinIcon icon='vaadin:edit' style={vaadinIconStyle} />
            }
            onClick={onRenameAccount}
            text={t('Rename')}
            withHoverEffect
          />
          <MenuItem
            fontSize='16px'
            iconComponent={
              <VaadinIcon icon='vaadin:file-remove' style={vaadinIconStyle} />
            }
            onClick={onForgetAccount}
            text={t('Forget account')}
            withHoverEffect
          />
          <MenuSeparator />
          <SelectChain
            address={address}
            defaultValue={currentGenesisHash ?? options[0].text}
            icon={getLogo(chain || undefined)}
            label={t('Chain')}
            onChange={onChangeNetwork}
            options={options}
            style={{ pt: 0, width: '100%' }}
          />
          <RemoteNodeSelector
            address={address}
            genesisHash={genesisHash ?? currentGenesisHash}
          />
          <IconButton
            onClick={closeMenu}
            sx={{
              left: '15px',
              p: 0,
              position: 'absolute',
              top: '58px'
            }}
          >
            <CloseIcon sx={{ color: 'text.primary', fontSize: 35 }} />
          </IconButton>
        </Grid>
      </Grid>
    </Dialog>
  );
}

export default React.memo(AccountMenu);
