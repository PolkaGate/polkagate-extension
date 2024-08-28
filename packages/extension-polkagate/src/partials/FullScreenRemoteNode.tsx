// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import type { ApiPromise } from '@polkadot/api';
import type { ChromeStorageGetResponse } from '../util/types';

import { SignalCellular0BarOutlined as LightClientEndpointIcon, SignalCellularAlt as SignalCellularAltIcon, SignalCellularAlt1Bar as SignalCellularAlt1BarIcon, SignalCellularAlt2Bar as SignalCellularAlt2BarIcon } from '@mui/icons-material';
import { Grid, Popover, Skeleton, Typography, useTheme } from '@mui/material';
// @ts-ignore
import { Circle } from 'better-react-spinkit';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { useEndpoint, useEndpoints, useInfo } from '../hooks';
import useIsExtensionPopup from '../hooks/useIsExtensionPopup';
import CalculateNodeDelay from '../util/calculateNodeDelay';
import { AUTO_MODE } from '../util/constants';

interface Props {
  address: string | undefined;
  iconSize?: number;
}

type EndpointsDelay = { name: string, delay: number | null | undefined, value: string }[];

function FullScreenRemoteNode ({ address, iconSize = 35 }: Props): React.ReactElement {
  const theme = useTheme();
  const { genesisHash } = useInfo(address);
  const { endpoint: endpointUrl, isOnManuel } = useEndpoint(address);
  const endpointOptions = useEndpoints(genesisHash);
  const onExtension = useIsExtensionPopup();

  const isLightClient = endpointUrl?.startsWith('light');

  const [currentDelay, setCurrentDelay] = useState<number | undefined>();
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
  const [endpointsDelay, setEndpointsDelay] = useState<EndpointsDelay>();
  const [api, setApi] = useState<ApiPromise | null | undefined>(null);
  const [fetchedApiAndDelay, setFetchedApiAndDelay] = useState<{ fetchedApi: ApiPromise | null | undefined, fetchedDelay: number | undefined }>();

  const bgcolorOnAccountDetail: string = useMemo(() => {
    if (onExtension) {
      return 'background.paper';
    } else {
      return 'transparent';
    }
  }, [onExtension]);

  const colors = {
    gray: theme.palette.mode === 'light' ? '#E8E0E5' : '#747474',
    green: '#1F7720',
    orange: '#FF5722',
    red: '#C70000'
  };

  const sanitizedCurrentEndpointName = useMemo(() => {
    const currentEndpointName = endpointOptions.find((endpoint) => endpoint.value === endpointUrl)?.text;

    return currentEndpointName?.replace(/^via\s/, '');
  }, [endpointOptions, endpointUrl]);

  const statusColor = useCallback((ms: number) => (
    ms <= 100
      ? colors.green
      : ms <= 300
        ? colors.orange
        : colors.red
  ), [colors.green, colors.orange, colors.red]);

  useEffect(() => {
    if (!endpointOptions || endpointOptions.length === 0) {
      return;
    }

    const mappedEndpoints = endpointOptions.map((endpoint) => ({ delay: null, name: endpoint.text.replace(/^via\s/, ''), value: endpoint.value }));

    setCurrentDelay(undefined);
    setEndpointsDelay(mappedEndpoints as EndpointsDelay);
  }, [endpointOptions]);

  const onChangeEndpoint = useCallback((newEndpoint: string): void => {
    setCurrentDelay(undefined);

    setEndpointsDelay((prevEndpoints) => {
      return prevEndpoints?.map((endpoint) => {
        if (endpoint.value === newEndpoint && !endpoint.delay) {
          return { ...endpoint, delay: undefined };
        }

        return endpoint;
      });
    });

    genesisHash && address && chrome.storage.local.get('endpoints', (res: { endpoints?: ChromeStorageGetResponse }) => {
      const savedEndpoints: ChromeStorageGetResponse = res?.endpoints || {};

      savedEndpoints[address] = savedEndpoints[address] || {};
      const checkForNewOne = newEndpoint === AUTO_MODE.value && !savedEndpoints[address][genesisHash]?.isOnManuel;

      savedEndpoints[address][genesisHash] = {
        checkForNewOne,
        endpoint: newEndpoint,
        isOnManuel: newEndpoint !== AUTO_MODE.value,
        timestamp: Date.now()
      };

      // eslint-disable-next-line no-void
      void chrome.storage.local.set({ endpoints: savedEndpoints });
    });
  }, [address, genesisHash]);

  useEffect(() => {
    // @ts-ignore
    if (fetchedApiAndDelay?.fetchedApi && fetchedApiAndDelay.fetchedApi?._options?.provider?.endpoint === endpointUrl) {
      setApi(fetchedApiAndDelay.fetchedApi);
      setCurrentDelay(fetchedApiAndDelay.fetchedDelay);
    }
  }, [endpointUrl, fetchedApiAndDelay]);

  // Function to calculate node delay and update state
  const calculateAndSetDelay = useCallback(() => {
    endpointUrl && CalculateNodeDelay(endpointUrl)
      .then((response) => {
        if (!response) {
          return;
        }

        setFetchedApiAndDelay({ fetchedApi: response.api, fetchedDelay: response.delay });
        setEndpointsDelay((prevEndpoints) => {
          return prevEndpoints?.map((endpoint) => {
            // @ts-ignore
            if (endpoint.value === response.api?._options?.provider?.endpoint) {
              return { ...endpoint, delay: response.delay };
            }

            return endpoint;
          });
        });

        response.api?.disconnect().catch(console.error);
      })
      .catch(console.error);
  }, [endpointUrl]);

  // Calculate initial delay when the component mounts
  useEffect(() => {
    if ((api && currentDelay === undefined) || api === null) {
      calculateAndSetDelay();
    }
  }, [api, calculateAndSetDelay, currentDelay]);

  // Set up the interval when the component mounts
  useEffect(() => {
    const intervalId = setInterval(calculateAndSetDelay, 60000);

    // Clean up the interval when the component unmounts
    return () => {
      clearInterval(intervalId);
    };
  }, [api, calculateAndSetDelay]);

  const NodeStatusIcon = ({ iconSize = 35, ms }: { ms: number | null | undefined, iconSize?: number }) => {
    return (
      <>
        {ms !== undefined && ms !== null &&
          (ms <= 100
            ? (
              <SignalCellularAltIcon
                sx={{ bottom: '2px', color: colors.green, fontSize: `${iconSize}px`, left: '2px', position: 'absolute' }}
              />
            )
            : ms <= 300
              ? (
                <SignalCellularAlt2BarIcon
                  sx={{ bottom: '2px', color: colors.orange, fontSize: `${iconSize}px`, left: '2px', position: 'absolute' }}
                />
              )
              : (
                <SignalCellularAlt1BarIcon
                  sx={{ bottom: '2px', color: colors.red, fontSize: `${iconSize}px`, left: '2px', position: 'absolute' }}
                />
              ))}
      </>
    );
  };

  const NodeStatusAndDelay = ({ endpointDelay, isSelected = false }: { endpointDelay: number | null | undefined, isSelected?: boolean }) => (
    <Grid alignItems='center' container item sx={{ width: 'fit-content' }}>
      {<Typography color={endpointDelay ? statusColor(endpointDelay) : 'inherit'} fontSize='16px' fontWeight={isSelected ? 500 : 400} pr='10px'>
        {endpointDelay
          ? `${endpointDelay} ms`
          : (endpointDelay === undefined || isSelected)
            ? <Skeleton
              animation='wave'
              height='20px'
              sx={{ display: 'inline-block', fontWeight: 'bold', mt: '5px', transform: 'none', width: '55px' }}
            />
            : ''}
      </Typography>}
      <Grid container height='35px' item position='relative' width='40px'>
        <SignalCellularAltIcon
          sx={{ bottom: '2px', color: colors.gray, fontSize: '35px', left: '2px', position: 'absolute' }}
        />
        <NodeStatusIcon ms={endpointDelay} />
      </Grid>
    </Grid>
  );

  const NodesList = () => (
    <Grid container direction='column' item sx={{ display: 'block', minWidth: '275px', py: '6px', width: 'fit-content' }}>
      {endpointsDelay && endpointsDelay.length > 0 &&
        endpointsDelay.map((endpoint, index) => {
          const selectedEndpoint = endpoint.name === sanitizedCurrentEndpointName;
          const isOnAutoMode = endpoint.name === AUTO_MODE.text && !isOnManuel;

          return (
            // eslint-disable-next-line react/jsx-no-bind
            <Grid alignItems='center' container item justifyContent='space-between' key={index} onClick={() => onChangeEndpoint(endpoint.value)} py='5px' sx={{ ':hover': { bgcolor: 'rgba(186, 40, 130, 0.1)' }, bgcolor: selectedEndpoint || isOnAutoMode ? 'rgba(186, 40, 130, 0.2)' : 'transparent', cursor: 'pointer', my: '3px', px: '15px', width: '100%' }}>
              <Typography fontSize='16px' fontWeight={selectedEndpoint || isOnAutoMode ? 500 : 400} pr='10px'>
                {endpoint.name}
              </Typography>
              {(!endpoint.name.includes('light client') && endpoint.name !== AUTO_MODE.text) &&
                <NodeStatusAndDelay endpointDelay={endpoint.delay} isSelected={selectedEndpoint} />
              }
              {isOnAutoMode && selectedEndpoint &&
                <Circle
                  color={theme.palette.primary.main}
                  scaleEnd={0.7}
                  scaleStart={0.4}
                  size={22}
                />
              }
            </Grid>
          );
        })}
    </Grid>
  );

  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    calculateAndSetDelay();
    setAnchorEl(event.currentTarget);
  }, [calculateAndSetDelay]);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  return (
    <>
      <Grid aria-describedby={id} component='button' container item onClick={handleClick} sx={{ bgcolor: bgcolorOnAccountDetail, border: '1px solid', borderColor: 'secondary.main', borderRadius: '5px', cursor: 'pointer', height: `${iconSize + 7}px`, position: 'relative', width: `${iconSize + 7}px`, zIndex: 10 }}>
        {isLightClient
          ? <LightClientEndpointIcon sx={{ bottom: '2px', color: colors.orange, fontSize: `${iconSize}px`, left: '2px', position: 'absolute' }} />
          : <>
            <SignalCellularAltIcon
              sx={{ bottom: '2px', color: colors.gray, fontSize: `${iconSize}px`, left: '2px', position: 'absolute' }}
            />
            <NodeStatusIcon iconSize={iconSize} ms={currentDelay} />
          </>
        }
      </Grid>
      <Popover
        PaperProps={{
          sx: { backgroundImage: 'none', bgcolor: 'background.paper', border: '1px solid', borderColor: theme.palette.mode === 'dark' ? 'secondary.main' : 'transparent', borderRadius: '7px', boxShadow: theme.palette.mode === 'dark' ? '0px 4px 4px rgba(255, 255, 255, 0.25)' : '0px 0px 25px 0px rgba(0, 0, 0, 0.50)', py: '5px' }
        }}
        anchorEl={anchorEl}
        anchorOrigin={{
          horizontal: 'right',
          vertical: 'bottom'
        }}
        id={id}
        onClose={handleClose}
        open={open}
        sx={{ mt: '5px' }}
        transformOrigin={{
          horizontal: 'right',
          vertical: 'top'
        }}
      >
        <NodesList />
      </Popover>
    </>
  );
}

export default React.memo(FullScreenRemoteNode);
