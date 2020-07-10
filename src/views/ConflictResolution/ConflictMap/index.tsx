import React from 'react';
import { _cs } from '@togglecorp/fujs';

import {
    RiCheckboxBlankCircleLine,
    RiCheckboxCircleLine,
} from 'react-icons/ri';

import LayerSwitcher from '#components/LayerSwitcher';
import Button from '#rsu/../v2/Action/Button';

import Map from '#re-map';
import MapContainer from '#re-map/MapContainer';
import MapBounds from '#re-map/MapBounds';
import MapSource from '#re-map/MapSource';
import MapLayer from '#re-map/MapSource/MapLayer';

import MapStyleContext, { MapStyle } from '#components/LayerContext';
import { ElementGeoJSON, ShapeType, Bounds } from '#constants/types';

import styles from './styles.scss';

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
    type: ShapeType;
    bounds: Bounds;
    geoJSON: ElementGeoJSON;
    defaultSelectedStyle?: string;
    onClick?: () => void;

    conflicted: boolean;
    disabled: boolean;
    selected: boolean;
}

interface State {
    selectedStyle: string;
}

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
            selectedStyle: defaultSelectedStyle || 'Wikimedia',
        };
    }

    private handleStyleChange = (value: string) => {
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

        const { mapStyles } = this.context;

        // FIXME: memoize creation of mapOptions
        const mapOptions = {
            bounds,
        };

        // FIXME: memoize calculation of selected mapStyle
        let mapStyle = mapStyles.find((item: MapStyle) => item.name === selectedStyle);
        if (mapStyle === undefined) {
            [mapStyle] = mapStyles;
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
                            geoJson={geoJSON}
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
                            geoJson={geoJSON}
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
                            geoJson={geoJSON}
                            sourceOptions={sourceOptions}
                        >
                            <MapLayer
                                layerKey="circle"
                                layerOptions={pointLayerOptions}
                            />
                        </MapSource>
                    )}
                    <LayerSwitcher
                        className={styles.layerSwitcher}
                        selected={selectedStyle}
                        onSelectedLayerChange={this.handleStyleChange}
                    />
                    {!disabled && onClick && (
                        <Button
                            className={styles.selectButton}
                            buttonType={selected ? 'button-success' : 'button-default'}
                            onClick={onClick}
                        >
                            {selected
                                ? <RiCheckboxCircleLine className={styles.icon} />
                                : <RiCheckboxBlankCircleLine className={styles.icon} />}
                            { selected ? 'Selected' : 'Select' }
                        </Button>
                    )}
                </Map>
            </div>
        );
    }
}

ConflictMap.contextType = MapStyleContext;

export default ConflictMap;
