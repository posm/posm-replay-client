import { compose, createStore, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';

import { isDevelopment } from '#config/env';

import createLogger from './middlewares/logger';

import reducer from './reducer';

const actionsToSkipLogging: string[] = [
    // Add action to skip logging
];

const middleware = [
    createLogger(actionsToSkipLogging),
];

// Override compose if development mode and redux extension is installed
const overrideCompose = !!composeWithDevTools && isDevelopment;

const applicableCompose = !overrideCompose
    ? compose
    : composeWithDevTools({
        actionsBlacklist: actionsToSkipLogging,
    });

const enhancer = applicableCompose(
    applyMiddleware(...middleware),
);

export default createStore(reducer, undefined, enhancer);
