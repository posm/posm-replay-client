import React from 'react';
import { _cs } from '@togglecorp/fujs';

import SegmentInput from '#rsci/SegmentInput';
import Button from '#rsu/../v2/Action/Button';

import Map from '#re-map';
import MapContainer from '#re-map/MapContainer';
import MapBounds from '#re-map/MapBounds';
import MapSource from '#re-map/MapSource';
import MapLayer from '#re-map/MapSource/MapLayer';

import { Content, ElementType, Bounds } from '#constants/types';

import styles from './styles.scss';

type StyleNames = 'Wikimedia' | 'OSM' | 'World Imagery' | 'Humanitarian';

interface MapStyle {
    name: StyleNames;
    data: mapboxgl.MapboxOptions['style'];
}

// url: process.env.REACT_APP_OSM_LAYER_URL,
const mapStyles: MapStyle[] = [
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

const sourceOptions: mapboxgl.GeoJSONSourceRaw = {
    type: 'geojson',
};
const areaFillLayerOptions: mapboxgl.Layer = {
    id: 'not-required',
    type: 'fill',
    paint: {
        'fill-color': 'red',
        'fill-opacity': 0.5,
    },
};
const areaOutlineLayerOptions: mapboxgl.Layer = {
    id: 'not-required',
    type: 'line',
    paint: {
        'line-color': 'blue',
        'line-opacity': 0.8,
        'line-width': 3,
    },
};
const linePointOptions: mapboxgl.Layer = {
    id: 'not-required',
    type: 'circle',
    paint: {
        'circle-color': 'red',
        'circle-radius': 3,
        'circle-stroke-width': 2,
        'circle-stroke-color': 'blue',
        'circle-stroke-opacity': 0.5,
    },
};

const lineLayerOptions: mapboxgl.Layer = {
    id: 'not-required',
    type: 'line',
    paint: {
        'line-color': 'blue',
        'line-opacity': 0.8,
        'line-width': 5,
    },
};

const pointLayerOptions: mapboxgl.Layer = {
    id: 'not-required',
    type: 'circle',
    paint: {
        'circle-color': 'red',
        'circle-radius': 8,
        'circle-opacity': 0.5,
        'circle-stroke-width': 3,
        'circle-stroke-color': 'blue',
        'circle-stroke-opacity': 0.8,
    },
};


interface Props {
    className?: string;
    mapClassName?: string;
    type: ElementType;
    bounds: Bounds;
    geoJSON: Content['geoJSON'];
    defaultSelectedStyle?: StyleNames;
    onClick?: () => void;

    conflicted: boolean;
    disabled: boolean;
    selected: boolean;
}

interface State {
    selectedStyle?: StyleNames;
}

const styleLabelSelector = (item: MapStyle) => item.name;
const styleKeySelector = (item: MapStyle) => item.name;

class ConflictMap extends React.PureComponent<Props, State> {
    public static defaultProps = {
        conflicted: false,
        selected: false,
        disabled: false,
    }

    public constructor(props: Props) {
        super(props);
        const { defaultSelectedStyle } = props;
        this.state = {
            selectedStyle: defaultSelectedStyle,
        };
    }

    private handleStyleChange = (value: StyleNames) => {
        this.setState({ selectedStyle: value });
    }

    public render() {
        const {
            type,
            bounds,
            geoJSON,
            className,
            mapClassName,
            onClick,

            conflicted,
            selected,
            disabled,
        } = this.props;
        const {
            selectedStyle,
        } = this.state;

        // FIXME: memoize creation of mapOptions
        const mapOptions = {
            bounds,
        };

        // FIXME: memoize calculation of selected mapStyle
        let mapStyle = mapStyles.find(item => item.name === selectedStyle);
        if (mapStyle === undefined) {
            mapStyle = mapStyles[0];
        }

        return (
            <div
                className={
                    _cs(
                        className,
                        styles.conflictMap,
                        conflicted && styles.conflicted,
                        selected && styles.selected,
                    )
                }
            >
                <Map
                    mapStyle={mapStyle.data}
                    mapOptions={mapOptions}
                    scaleControlShown
                    navControlShown
                >
                    <MapContainer
                        className={_cs(styles.map, mapClassName)}
                    />
                    <MapBounds
                        bounds={mapOptions.bounds}
                        padding={50}
                    />
                    {geoJSON && type === 'area' && (
                        <MapSource
                            sourceKey="area"
                            geoJSON={geoJSON}
                            sourceOptions={sourceOptions}
                        >
                            <MapLayer
                                layerKey="fill"
                                layerOptions={areaFillLayerOptions}
                            />
                            <MapLayer
                                layerKey="outline"
                                layerOptions={areaOutlineLayerOptions}
                            />
                            <MapLayer
                                layerKey="circle"
                                layerOptions={linePointOptions}
                            />
                        </MapSource>
                    )}
                    {geoJSON && type === 'line' && (
                        <MapSource
                            sourceKey="line"
                            geoJSON={geoJSON}
                            sourceOptions={sourceOptions}
                        >
                            <MapLayer
                                layerKey="outline"
                                layerOptions={lineLayerOptions}
                            />
                            <MapLayer
                                layerKey="circle"
                                layerOptions={linePointOptions}
                            />
                        </MapSource>
                    )}
                    {geoJSON && type === 'point' && (
                        <MapSource
                            sourceKey="point"
                            geoJSON={geoJSON}
                            sourceOptions={sourceOptions}
                        >
                            <MapLayer
                                layerKey="circle"
                                layerOptions={pointLayerOptions}
                            />
                        </MapSource>
                    )}
                    <SegmentInput
                        className={styles.layerSwitcher}
                        showLabel={false}
                        showHintAndError={false}
                        labelSelector={styleLabelSelector}
                        keySelector={styleKeySelector}
                        value={selectedStyle}
                        options={mapStyles}
                        onChange={this.handleStyleChange}
                    />
                    {!disabled && onClick && (
                        <Button
                            className={styles.selectButton}
                            buttonType={selected ? 'button-success' : 'button-default'}
                            iconName={selected ? 'checkmarkCircle' : 'checkmarkCircleEmpty'}
                            onClick={onClick}
                        >
                            { selected ? 'Selected' : 'Select' }
                        </Button>
                    )}
                </Map>
            </div>
        );
    }
}

export default ConflictMap;
