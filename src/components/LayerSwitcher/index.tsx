import React from 'react';
import { _cs } from '@togglecorp/fujs';

import DropdownMenu from '#rsca/DropdownMenu';
import Button from '#rsu/../v2/Action/Button';

import styles from './styles.scss';

export type StyleNames = 'Wikimedia' | 'OSM' | 'World Imagery' | 'Humanitarian' | 'Offline';

export interface MapStyle {
    name: StyleNames;
    data: mapboxgl.MapboxOptions['style'];
}

// url: process.env.REACT_APP_OSM_LAYER_URL,
export const mapStyles: MapStyle[] = [
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
    mapStyles.push({
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


interface Props {
    className?: string;
    selected: StyleNames;
    onSelectedLayerChange: (selected: StyleNames) => void;
}

const styleLabelSelector = (item: MapStyle) => item.name;
const styleKeySelector = (item: MapStyle) => item.name;

function LayerSwitcher(props: Props) {
    const {
        className,
        selected,
        onSelectedLayerChange,
    } = props;

    return (
        <DropdownMenu
            className={_cs(styles.layerSwitcher, className)}
            dropdownIconClassName={styles.icon}
            dropdownClassName={styles.container}
            dropdownIcon="layers"
            closeOnClick
        >
            {mapStyles.map(mapStyleItem => (
                <Button
                    key={styleKeySelector(mapStyleItem)}
                    className={_cs(
                        styles.layerButton,
                        selected === styleKeySelector(mapStyleItem)
                        && styles.active,
                    )}
                    onClick={() => onSelectedLayerChange(
                        styleKeySelector(mapStyleItem),
                    )}
                >
                    {styleLabelSelector(mapStyleItem)}
                </Button>
            ))}
        </DropdownMenu>
    );
}

export default LayerSwitcher;
