export const tooltipOptions: mapboxgl.PopupOptions = {
    closeOnClick: true,
    closeButton: false,
    maxWidth: '480px',
};

export const sourceOptions: mapboxgl.GeoJSONSourceRaw = {
    type: 'geojson',
};

export const areaFillLayerOptions: mapboxgl.Layer = {
    id: 'not-required',
    type: 'fill',
    paint: {
        'fill-color': [
            'match',
            ['get', 'resolution'],
            'resolved', 'green',
            'partially_resolved', 'yellow',
            'unresolved', 'red',
            'all', '#414141',
            'black',
        ],
        'fill-opacity': 0.5,
    },
};

export const areaOutlineLayerOptions: mapboxgl.Layer = {
    id: 'not-required',
    type: 'line',
    paint: {
        'line-color': 'black',
        'line-opacity': 0.8,
        'line-width': 3,
    },
};

export const linePointOptions: mapboxgl.Layer = {
    id: 'not-required',
    type: 'circle',
    paint: {
        'circle-color': [
            'match',
            ['get', 'resolution'],
            'resolved', 'green',
            'partially_resolved', 'yellow',
            'unresolved', 'red',
            'all', '#414141',
            'black',
        ],
        'circle-radius': 3,
        'circle-stroke-width': 1,
        'circle-stroke-color': 'black',
        'circle-stroke-opacity': 0.5,
    },
};

export const lineLayerOptions: mapboxgl.Layer = {
    id: 'not-required',
    type: 'line',
    paint: {
        'line-color': [
            'match',
            ['get', 'resolution'],
            'resolved', 'green',
            'partially_resolved', 'yellow',
            'unresolved', 'red',
            'all', '#414141',
            'black',
        ],
        'line-opacity': 0.8,
        'line-width': 5,
    },
};

export const pointLayerOptions: mapboxgl.Layer = {
    id: 'not-required',
    type: 'circle',
    paint: {
        'circle-color': [
            'match',
            ['get', 'resolution'],
            'resolved', 'green',
            'partially_resolved', 'yellow',
            'unresolved', 'red',
            'black',
        ],
        'circle-radius': 8,
        'circle-opacity': 0.5,
        'circle-stroke-width': 1,
        'circle-stroke-color': 'black',
        'circle-stroke-opacity': 0.8,
    },
};

export const legendItems = [
    {
        color: 'red',
        title: 'Unresolved',
    },
    {
        color: 'yellow',
        title: 'Partially Resolved',
    },
    {
        color: 'green',
        title: 'Resolved',
    },
    {
        color: '#414141',
        title: 'Non Conflicted',
    },
];
