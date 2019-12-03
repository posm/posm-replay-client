import { isTruthy, mapToMap } from '@togglecorp/fujs';

import * as Type from './types';

import initialState from './initialState';

// ACTION CREATORS

export function setRouteParamsAction(
    { match, location }: { match: Type.Match; location: Location },
) {
    return {
        type: Type.RouteType.SET_PARAMS,
        match,
        location,
    };
}

export function clearRouteStateAction() {
    return {
        type: Type.RouteType.CLEAR_STATE,
    };
}

// REDUCERS

function setRouteParams(state: Type.RouteState, action: Type.SetRouteAction) {
    const {
        match: {
            path,
            url,
            isExact,
            params,
        },
        location: {
            state: routeState,
            key,
        },
    } = action;

    const isFirstPage = key === undefined;

    const newState = {
        path,
        url,
        isExact,
        params: mapToMap(
            params,
            (k: string) => k,
            val => (isTruthy(val) ? +val : undefined),
        ),
        routeState,
        // NOTE: once isFirstPage is set to false, it cannot be set to true
        // NOTE: do this because when we use
        // window.location.replace() it clears the key in location
        isFirstPage: !!state.isFirstPage && isFirstPage,
    };
    return newState;
}

// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
function clearRouteState(state: Type.RouteState, action: Type.ClearRouteAction) {
    return {
        ...state,
        routeState: {},
    };
}

export default function routeReducer(
    state = initialState,
    action: Type.RouteActionTypes,
): Type.RouteState {
    switch (action.type) {
        case Type.RouteType.SET_PARAMS:
            return setRouteParams(state, action);
        case Type.RouteType.CLEAR_STATE:
            return clearRouteState(state, action);
        default:
            return state;
    }
}
