import React from 'react';
import { _cs } from '@togglecorp/fujs';

import Map from '#re-map';
import MapContainer from '#re-map/MapContainer';
import MapBounds from '#re-map/MapBounds';
import MapSource from '#re-map/MapSource';
import MapLayer from '#re-map/MapSource/MapLayer';

import { ConflictElement } from '#constants/types';

import styles from './styles.scss';


const mapStyle: mapboxgl.MapboxOptions['style'] = {
    version: 8,
    name: 'Base Layer',
    sources: {
        mm: {
            type: 'raster',
            url: process.env.REACT_APP_OSM_LAYER_URL,
            tileSize: 256,
            // tileSize: 256,
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
};

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
        'line-color': 'red',
        'line-opacity': 0.8,
        'line-width': 3,
    },
};

const lineLayerOptions: mapboxgl.Layer = {
    id: 'not-required',
    type: 'line',
    paint: {
        'line-color': 'red',
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
        'circle-stroke-color': 'red',
        'circle-stroke-opacity': 0.8,
    },
};


interface Props {
    className?: string;
    data: ConflictElement;
}

interface State {
}

class ConflictDetail extends React.PureComponent<Props, State> {
    public render() {
        const {
            className,
            data,
        } = this.props;

        const {
            type,
            original: {
                bounds,
                geoJSON,
            },
        } = data;

        const mapOptions = {
            bounds: data.original.bounds,
        };

        return (
            <div className={_cs(className, styles.conflictDetail)}>
                <h1>
                    { data.title }
                </h1>
                <h2>
                    Original
                </h2>
                <Map
                    mapStyle={mapStyle}
                    mapOptions={mapOptions}
                    scaleControlShown
                    navControlShown
                >
                    <MapContainer
                        className={styles.map}
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
                </Map>
                <h3>
                    Tags
                </h3>
            </div>
        );
    }
}

export default ConflictDetail;
