export interface Route {
    path: string;
    name: string;
    title: string;
    load: any;
}
export interface NavbarRoute extends Route {
    navbar: true;
    iconName: string;
    disabled?: boolean;
}
export interface FallbackRoute {
    default: true;
    title: string;
    name: string;
    load: any;
    path: undefined;
}

export function hasNavbar(route: SomeRoute): route is NavbarRoute {
    return !!(route as NavbarRoute).navbar;
}

export type SomeRoute = Route | NavbarRoute | FallbackRoute;

export function isNotFallbackRoute(route: SomeRoute): route is Route {
    return route.path !== undefined;
}

const routeSettings: SomeRoute[] = [
    {
        path: '/',
        name: 'dashboard',
        title: 'Dashboard',
        load: () => import('../views/Dashboard'),
        navbar: true,
    },
    {
        name: 'conflictResolution',
        title: 'Conflict Resolution',
        path: '/conflict-resolution/',
        load: () => import('../views/ConflictResolution'),
        // navbar: true,
    },
    {
        name: 'configuration',
        title: 'Configuration',
        path: '/configuration/',
        load: () => import('../views/Configuration'),
        navbar: true,
    },
    {
        name: 'fourHundredThree',
        title: '403',
        path: '/403/',
        load: () => import('../views/FourHundredThree'),
    },
    {
        name: 'fourHundredFour',
        title: '404',
        load: () => import('../views/FourHundredFour'),
        default: true,
        path: undefined,
    },
];

export default routeSettings;
