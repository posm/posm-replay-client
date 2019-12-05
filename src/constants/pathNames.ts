import { listToMap } from '@togglecorp/fujs';

import routeSettings, { isNotFallbackRoute } from './routeSettings';

// FIXME: pathNames is not exactly type-safe
const mapping: {
    [key: string]: string;
} = listToMap(
    routeSettings.filter(isNotFallbackRoute),
    item => item.name,
    item => item.path,
);

export default mapping;
