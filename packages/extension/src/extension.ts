// Copyright 2019-2024 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@polkadot/extension-inject/crossenv';

import * as Sentry from '@sentry/react';

import { createView, Popup } from '@polkadot/extension-ui';

if (localStorage.getItem('sentryEnabled') === null) {
  localStorage.setItem('sentryEnabled', 'true'); // Default to true
}

// Check user preference for Sentry
const isSentryEnabled = localStorage.getItem('sentryEnabled') === 'true';

if (isSentryEnabled) {
  Sentry.init({
    dsn: process.env['SENTRY_DSN'],
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration()
    ],
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    tracePropagationTargets: [
      /^chrome-extension:\/\/mgojgfjhknpmlojihdpjikinpgcaadlj/, // Dev extension ID
      /^chrome-extension:\/\/ginchbkmljhldofnbjabmeophlhdldgp/ // Production extension ID
    ],
    replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    replaysOnErrorSampleRate: 1.0 // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  });
} else {
  console.log('Sentry is disabled');
}

// Start the extension UI
createView(Popup);
