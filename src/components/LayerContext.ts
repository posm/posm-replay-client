import React from 'react';

// url: process.env.REACT_APP_OSM_LAYER_URL,
export const defaultMapStyles: MapStyle[] = [
    {
        name: 'Wikimedia',
        data: {
            version: 8,
            name: 'Wikimedia',
            sources: {
                base: {
                    type: 'raster',
                    tiles: [
                        'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png',
                    ],
                    tileSize: 256,
                },
            },
            layers: [
                {
                    id: 'background',
                    type: 'background',
                    paint: { 'background-color': 'rgb(239, 239, 239)' },
                },
                {
                    id: 'base',
                    type: 'raster',
                    source: 'base',
                },
            ],
        },
    },
    {
        name: 'OSM',
        data: {
            version: 8,
            name: 'OSM',
            sources: {
                base: {
                    type: 'raster',
                    tiles: [
                        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    ],
                    tileSize: 256,
                },
            },
            layers: [
                {
                    id: 'background',
                    type: 'background',
                    paint: { 'background-color': 'rgb(239, 239, 239)' },
                },
                {
                    id: 'base',
                    type: 'raster',
                    source: 'base',
                },
            ],
        },
    },
    {
        name: 'World Imagery',
        data: {
            version: 8,
            name: 'World Imagery',
            sources: {
                base: {
                    type: 'raster',
                    tiles: [
                        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.jpg',
                    ],
                    tileSize: 256,
                },
            },
            layers: [
                {
                    id: 'background',
                    type: 'background',
                    paint: { 'background-color': 'rgb(239, 239, 239)' },
                },
                {
                    id: 'base',
                    type: 'raster',
                    source: 'base',
                },
            ],
        },
    },
    {
        name: 'Humanitarian',
        data: {
            version: 8,
            name: 'Humanitarian',
            sources: {
                base: {
                    type: 'raster',
                    tiles: [
                        'http://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
                        'http://b.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
                    ],
                    tileSize: 256,
                },
            },
            layers: [
                {
                    id: 'background',
                    type: 'background',
                    paint: { 'background-color': 'rgb(239, 239, 239)' },
                },
                {
                    id: 'base',
                    type: 'raster',
                    source: 'base',
                },
            ],
        },
    },
];

if (process.env.REACT_APP_OSM_LAYER_URL) {
    defaultMapStyles.push({
        name: 'Offline',
        data: {
            version: 8,
            sources: {
                mm: {
                    type: 'raster',
                    url: process.env.REACT_APP_OSM_LAYER_URL,
                    tileSize: 256,
                },
            },
            layers: [
                {
                    id: 'background',
                    type: 'background',
                    paint: { 'background-color': 'rgb(239, 239, 239)' },
                },
                {
                    id: 'mm_layer',
                    type: 'raster',
                    source: 'mm',
                },
            ],
        },
    });
}

export interface MapStyle {
    name: string;
    data: mapboxgl.MapboxOptions['style'];
}

export interface MapStyleContextProps {
    mapStyles: MapStyle[];
    setMapStyles?: (mapStyles: MapStyle[]) => void;
    setMapStyle: (mapStyle: MapStyle) => void;
}

export default React.createContext<MapStyleContextProps>({
    mapStyles: defaultMapStyles,
    setMapStyles: (mapStyles: MapStyle[]) => {
        console.warn('Trying to set mapStyles', mapStyles);
    },
    setMapStyle: (mapStyle: MapStyle) => {
        console.warn('Trying to set mapStyle', mapStyle);
    },
});
