// Copyright 2019-2024 @polkadot/extension-polkagate authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable react/jsx-max-props-per-line */

import type { DetailProp, DetailsProp } from '../utils/types';

import { Close as CloseIcon, OpenInFull as OpenInFullIcon } from '@mui/icons-material';
import { Grid, IconButton, Typography, useTheme } from '@mui/material';
import React, { useCallback, useState } from 'react';
import ReactMarkdown from 'react-markdown';

import { useTranslation } from '../../../components/translate';
import { DraggableModal } from '../../governance/components/DraggableModal';
import NftAvatar from './ItemAvatar';
import ItemFullscreenModal from './ItemFullScreenModal';

export const Detail = ({ inline = true, text, title }: DetailProp) => (
  <Grid container item>
    <Typography fontSize='16px' fontWeight={500} sx={inline ? { pr: '10px', width: 'fit-content' } : {}}>
      {title}:
    </Typography>
    <Typography fontSize='16px' fontWeight={400} sx={{ '> p': { m: 0 } }} textAlign='left'>
      <ReactMarkdown
        linkTarget='_blank'
      >
        {text}
      </ReactMarkdown>
    </Typography>
  </Grid>
);

export default function Details ({ details: { contentType, description, image, metadataLink, name }, itemInformation: { collectionId, isNft, itemId }, setShowDetail, show }: DetailsProp): React.ReactElement {
  const { t } = useTranslation();
  const theme = useTheme();

  const [showFullscreen, setShowFullscreen] = useState<boolean>(false);

  const closeDetail = useCallback(() => setShowDetail(false), [setShowDetail]);

  const openFullscreen = useCallback(() => {
    document.documentElement.requestFullscreen().catch(console.error);
    setShowFullscreen(true);
  }, []);

  const closeFullscreen = useCallback(() => {
    setShowFullscreen(false);
    document.fullscreenEnabled &&
      document.exitFullscreen().catch(console.error);
  }, []);

  return (
    <>
      <DraggableModal minHeight={515} onClose={closeDetail} open={show} width={800}>
        <Grid container item>
          <Grid alignItems='center' container item justifyContent='space-between' sx={{ borderBottom: '1px solid', borderBottomColor: 'divider', mb: '20px' }}>
            <Typography fontSize='22px' fontWeight={700}>
              {isNft ? t('NFT Detail') : t('Unique Detail')}
            </Typography>
            <Grid item>
              <IconButton onClick={openFullscreen} sx={{ mr: 1 }}>
                <OpenInFullIcon sx={{ color: 'primary.main' }} />
              </IconButton>
              <IconButton onClick={closeDetail}>
                <CloseIcon onClick={closeDetail} sx={{ color: 'primary.main', stroke: theme.palette.primary.main, strokeWidth: 1.5 }} />
              </IconButton>
            </Grid>
          </Grid>
          <Grid container item justifyContent='space-between' width='740px'>
            <Grid alignItems='center' container item width='fit-content'>
              <NftAvatar
                height='400px'
                image={image}
                width='320px'
              />
            </Grid>
            <Grid alignContent='center' alignItems='center' container item sx={{ m: '20px', maxHeight: '400px', overflowY: 'scroll', rowGap: '10px', width: '370px' }}>
              {name &&
                <Typography fontSize='14px' fontWeight={400} sx={{ maxWidth: '380px', overflow: 'hidden', textAlign: 'center', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                  {name}
                </Typography>
              }
              {description &&
                <Detail
                  inline={false}
                  text={description}
                  title={t('Description')}
                />
              }
              {collectionId !== undefined &&
                <Detail
                  text={collectionId}
                  title={t('Collection ID')}
                />
              }
              {itemId !== undefined &&
                <Detail
                  text={itemId}
                  title={isNft ? t('NFT ID') : t('Unique ID')}
                />
              }
              {metadataLink &&
                <Detail
                  text={`[application/json](${metadataLink})`}
                  title={t('Metadata')}
                />
              }
              {image &&
                <Detail
                  text={`[${contentType}](${image})`}
                  title={t('Image')}
                />
              }
            </Grid>
          </Grid>
        </Grid>
      </DraggableModal>
      <ItemFullscreenModal
        image={image}
        onClose={closeFullscreen}
        open={showFullscreen}
      />
    </>
  );
}