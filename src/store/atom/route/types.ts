import { Obj } from '@togglecorp/fujs';

export interface Match {
    path: string;
    url: string;
    isExact: boolean;
    params?: Obj<string>;
}
export interface Location {
    state: object;
    key: string;
}

// INTERFACE

export interface RouteState {
    path?: string;
    url?: string;
    isExact?: boolean;
    params?: Obj<number | undefined>;
    routeState: object;
    isFirstPage: boolean;
}

// ACTION TYPES

// eslint-disable-next-line import/prefer-default-export
export enum RouteType {
    SET_PARAMS = 'route/SET_PARAMS',
    CLEAR_STATE = 'route/CLEAR_STATE',
}

// ACTION CREATOR INTERFACE

export interface SetRouteAction {
    type: typeof RouteType.SET_PARAMS;
    match: Match;
    location: Location;
}

export interface ClearRouteAction {
    type: typeof RouteType.CLEAR_STATE;
}

export type RouteActionTypes = SetRouteAction | ClearRouteAction;
