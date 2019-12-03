import { createSelector } from 'reselect';
import { isTruthy } from '@togglecorp/fujs';

import { AppState } from '../../types';

const emptyObject = {};

export const routeUrlSelector = ({ route }: AppState) => (
    route.url
);

const routePathSelector = ({ route }: AppState) => (
    route.path
);

export const routeIsFirstPageSelector = ({ route }: AppState) => (
    route.isFirstPage
);

const propsSelector = (state: AppState, props: object) => props;

const routeParamsSelector = ({ route }: AppState) => (
    route.params
);

export const routeStateSelector = ({ route }: AppState) => (
    route.routeState || emptyObject
);

const createRouteSelector = (name: string) => createSelector(
    routeParamsSelector,
    propsSelector,
    (routeParams, props) => {
        if (isTruthy(props)) {
            const val = props as { [key: string]: unknown };
            if (typeof val === 'string' || typeof val === 'number') {
                return +val;
            }
        }
        if (!routeParams) {
            return undefined;
        }
        return routeParams[name];
    },
);

// export const incidentIdFromRouteSelector = createRouteSelector('incidentId');
