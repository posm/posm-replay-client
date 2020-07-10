import React, { useState, useCallback, useContext, useMemo } from 'react';
import {
    _cs,
    isDefined,
    doesObjectHaveNoData,
} from '@togglecorp/fujs';

import MapStyleContext, { MapStyle } from '#components/LayerContext';
import LayerSwitcher from '#components/LayerSwitcher';
import TextOutput from '#components/TextOutput';

import Map from '#re-map';
import MapContainer from '#re-map/MapContainer';
import MapBounds from '#re-map/MapBounds';
import MapSource from '#re-map/MapSource';
import MapLayer from '#re-map/MapSource/MapLayer';
import MapTooltip from '#re-map/MapTooltip';

import {
    Bounds,
    ShapeType,
    ConflictElement,
    ResolutionStatus,
    ElementGeoJSON,
} from '#constants/types';

import {
    createRequestClient,
    methods,
    NewProps,
    ClientAttributes,
} from '#request';

import styles from './styles.scss';
import {
    tooltipOptions,
    sourceOptions,
    areaFillLayerOptions,
    areaOutlineLayerOptions,
    linePointOptions,
    lineLayerOptions,
    pointLayerOptions,
    legendItems,
} from './mapTheme';

interface Region {
    tags: {
        [key: string]: string | undefined;
    };
}

interface ClickedRegion {
    feature: GeoJSON.Feature<GeoJSON.Polygon, Region>;
    lngLat: mapboxgl.LngLatLike;
}

function getShapeType(geoJson: ElementGeoJSON): ShapeType {
    const { geometry: { type } } = geoJson;
    if (type === 'Point' || type === 'MultiPoint') {
        return 'point';
    }
    if (type === 'LineString' || type === 'MultiLineString') {
        return 'line';
    }
    if (type === 'Polygon' || type === 'MultiPolygon') {
        return 'area';
    }

    return 'point';
}

interface ConflictsResponse {
    results: ConflictElement[];
}

function getFeatures(
    conflictElements: ConflictElement[],
    status: ResolutionStatus,
    overwriteStatus: string,
) {
    const filteredConflictElements = conflictElements
        .filter(element => element.status === status);

    function getGeoJson(element: ConflictElement, finalOverwriteStatus: string) {
        const geoJson = element.localGeojson && !doesObjectHaveNoData(element.localGeojson)
            ? element.localGeojson
            : element.originalGeojson;

        return {
            ...geoJson,
            properties: {
                ...geoJson.properties,
                resolution: finalOverwriteStatus,
            },
        };
    }

    const points: ElementGeoJSON[] = filteredConflictElements
        .filter(element => getShapeType(element.originalGeojson) === 'point')
        .map(element => getGeoJson(element, overwriteStatus));

    const lines: ElementGeoJSON[] = filteredConflictElements
        .filter(element => getShapeType(element.originalGeojson) === 'line')
        .map(element => getGeoJson(element, overwriteStatus));

    const areas: ElementGeoJSON[] = filteredConflictElements
        .filter(element => getShapeType(element.originalGeojson) === 'area')
        .map(element => getGeoJson(element, overwriteStatus));

    return [points, lines, areas];
}

const getSeggregatedGeojsonsForConflicts = (
    resolved: ConflictsResponse,
    partiallyResolved: ConflictsResponse,
    unresolved: ConflictsResponse,
) => {
    const pointFeatures: ElementGeoJSON[] = [];
    const lineFeatures: ElementGeoJSON[] = [];
    const areaFeatures: ElementGeoJSON[] = [];

    if (isDefined(resolved?.results)) {
        const [points, lines, areas] = getFeatures(resolved.results, 'resolved', 'resolved');
        pointFeatures.push(...points);
        lineFeatures.push(...lines);
        areaFeatures.push(...areas);
    }

    if (isDefined(partiallyResolved?.results)) {
        const [points, lines, areas] = getFeatures(
            partiallyResolved.results,
            'partially_resolved',
            'partially_resolved',
        );
        pointFeatures.push(...points);
        lineFeatures.push(...lines);
        areaFeatures.push(...areas);
    }

    if (isDefined(unresolved?.results)) {
        const [points, lines, areas] = getFeatures(
            unresolved.results,
            'unresolved',
            'unresolved',
        );
        pointFeatures.push(...points);
        lineFeatures.push(...lines);
        areaFeatures.push(...areas);
    }

    return ({
        pointGeojson: {
            type: 'FeatureCollection',
            features: pointFeatures,
        },
        lineGeojson: {
            type: 'FeatureCollection',
            features: lineFeatures,
        },
        areaGeojson: {
            type: 'FeatureCollection',
            features: areaFeatures,
        },
    });
};

const getSeggregatedGeojsonsForAll = (
    allElements: ConflictsResponse,
) => {
    const pointFeatures: ElementGeoJSON[] = [];
    const lineFeatures: ElementGeoJSON[] = [];
    const areaFeatures: ElementGeoJSON[] = [];

    if (isDefined(allElements?.results)) {
        const [points, lines, areas] = getFeatures(
            allElements.results,
            'resolved',
            'all',
        );
        pointFeatures.push(...points);
        lineFeatures.push(...lines);
        areaFeatures.push(...areas);
    }

    return ({
        pointGeojson: {
            type: 'FeatureCollection',
            features: pointFeatures,
        },
        lineGeojson: {
            type: 'FeatureCollection',
            features: lineFeatures,
        },
        areaGeojson: {
            type: 'FeatureCollection',
            features: areaFeatures,
        },
    });
};

interface OwnProps {
    className?: string;
    totalResolvedElements?: number;
    totalPartiallyResolvedElements?: number;
    conflictsVisibility: boolean;
    allElementsVisibility: boolean;
    bounds?: Bounds;
}

interface Params {
}

const requestOptions: { [key: string]: ClientAttributes<OwnProps, Params> } = {
    unresolvedConflictsGet: {
        url: '/unresolved-elements/',
        method: methods.GET,
        onMount: ({ props }) => !!props.conflictsVisibility,
        onPropsChanged: {
            totalResolvedElements: ({ props, prevProps }) => (
                props.conflictsVisibility
                && (props.totalResolvedElements !== prevProps.totalResolvedElements)
            ),
            totalPartiallyResolvedElements: ({ props, prevProps }) => (
                props.conflictsVisibility
                && (
                    props.totalPartiallyResolvedElements
                    !== prevProps.totalPartiallyResolvedElements
                )
            ),
        },
    },
    partiallyResolvedConflictsGet: {
        url: '/partial-resolved-elements/',
        method: methods.GET,
        onMount: ({ props }) => !!props.conflictsVisibility,
        onPropsChanged: {
            totalResolvedElements: ({ props, prevProps }) => (
                props.conflictsVisibility
                && (props.totalResolvedElements !== prevProps.totalResolvedElements)
            ),
            totalPartiallyResolvedElements: ({ props, prevProps }) => (
                props.conflictsVisibility
                && (
                    props.totalPartiallyResolvedElements
                    !== prevProps.totalPartiallyResolvedElements
                )
            ),
        },
    },
    resolvedConflictsGet: {
        url: '/resolved-elements/',
        method: methods.GET,
        onMount: ({ props }) => !!props.conflictsVisibility,
        onPropsChanged: {
            totalResolvedElements: ({ props, prevProps }) => (
                props.conflictsVisibility
                && (props.totalResolvedElements !== prevProps.totalResolvedElements)
            ),
            totalPartiallyResolvedElements: ({ props, prevProps }) => (
                props.conflictsVisibility
                && (
                    props.totalPartiallyResolvedElements
                    !== prevProps.totalPartiallyResolvedElements
                )
            ),
        },
    },
    nonConflictedElementsGet: {
        url: '/all-changes/?state=no-conflicts',
        onMount: ({ props }) => !!props.allElementsVisibility,
        method: methods.GET,
        onPropsChanged: {
            allElementsVisibility: ({ props }) => props.allElementsVisibility,
        },
    },
};

type Props = NewProps<OwnProps, Params>;

function DashboardMap(props: Props) {
    const {
        bounds,
        className,
        requests: {
            unresolvedConflictsGet: {
                response: unresolvedConflictsResponse,
            },
            resolvedConflictsGet: {
                response: resolvedConflictsResponse,
            },
            partiallyResolvedConflictsGet: {
                response: partiallyResolvedConflictsResponse,
            },
            nonConflictedElementsGet: {
                response: allElementsResponse,
            },
        },
        allElementsVisibility,
        conflictsVisibility,
    } = props;

    const { mapStyles } = useContext(MapStyleContext);
    const [selectedStyle, setSelectedStyle] = useState('Wikimedia');

    const [
        clickedRegionProperties,
        setClickedRegionProperties,
    ] = useState<ClickedRegion | undefined>();

    const mapStyle = useMemo(() => {
        let style = mapStyles.find((item: MapStyle) => item.name === selectedStyle);
        if (style === undefined) {
            [style] = mapStyles;
        }
        return style;
    }, [selectedStyle, mapStyles]);

    const handleMapRegionClick = useCallback((
        feature: mapboxgl.MapboxGeoJSONFeature,
        lngLat: mapboxgl.LngLat,
    ) => {
        const safeFeature = feature as unknown as GeoJSON.Feature<GeoJSON.Polygon, Region>;
        setClickedRegionProperties({
            feature: {
                ...safeFeature,
                // FIXME: later
                properties: {
                    ...safeFeature.properties,
                    tags: JSON.parse(feature.properties.tags),
                },
            },
            lngLat,
        });
        return true;
    }, [setClickedRegionProperties]);

    const handleTooltipClose = useCallback(() => {
        setClickedRegionProperties(undefined);
    }, [setClickedRegionProperties]);

    const mapOptions = useMemo(() => {
        if (!bounds) {
            return {};
        }
        return {
            bounds,
            zoomLevel: 3,
        };
    }, [bounds]);

    const popupTags = clickedRegionProperties?.feature.properties.tags;

    const {
        lineGeojson: lineGeojsonForConflicts,
        pointGeojson: pointGeojsonForConflicts,
        areaGeojson: areaGeojsonForConflicts,
    } = useMemo(() => getSeggregatedGeojsonsForConflicts(
        resolvedConflictsResponse as ConflictsResponse,
        partiallyResolvedConflictsResponse as ConflictsResponse,
        unresolvedConflictsResponse as ConflictsResponse,
    ), [
        resolvedConflictsResponse,
        partiallyResolvedConflictsResponse,
        unresolvedConflictsResponse,
    ]);

    const {
        lineGeojson: lineGeojsonForAll,
        pointGeojson: pointGeojsonForAll,
        areaGeojson: areaGeojsonForAll,
    } = useMemo(() => getSeggregatedGeojsonsForAll(
        allElementsResponse as ConflictsResponse,
    ), [allElementsResponse]);

    return (
        <Map
            mapStyle={mapStyle.data}
            mapOptions={mapOptions}
            scaleControlShown
            navControlShown
        >
            <MapBounds
                bounds={bounds}
                padding={50}
            />
            <MapContainer className={_cs(styles.map, className)} />
            {clickedRegionProperties && (
                <MapTooltip
                    coordinates={clickedRegionProperties.lngLat}
                    tooltipOptions={tooltipOptions}
                    onHide={handleTooltipClose}
                >
                    <div>
                        {popupTags && Object.keys(popupTags).map(
                            key => (
                                <TextOutput
                                    key={key}
                                    label={key}
                                    labelClassName={styles.tooltipLabel}
                                    value={popupTags[key]}
                                />
                            ),
                        )}
                    </div>
                </MapTooltip>
            )}
            {conflictsVisibility && areaGeojsonForConflicts && (
                <MapSource
                    sourceKey="area"
                    geoJson={areaGeojsonForConflicts}
                    sourceOptions={sourceOptions}
                >
                    <MapLayer
                        layerKey="fill-area"
                        layerOptions={areaFillLayerOptions}
                        onClick={handleMapRegionClick}
                    />
                    <MapLayer
                        layerKey="outline-area"
                        layerOptions={areaOutlineLayerOptions}
                        onClick={handleMapRegionClick}
                    />
                    <MapLayer
                        layerKey="circle-area"
                        layerOptions={linePointOptions}
                        onClick={handleMapRegionClick}
                    />
                </MapSource>
            )}
            {conflictsVisibility && lineGeojsonForConflicts && (
                <MapSource
                    sourceKey="line"
                    geoJson={lineGeojsonForConflicts}
                    sourceOptions={sourceOptions}
                >
                    <MapLayer
                        layerKey="outline-line"
                        layerOptions={lineLayerOptions}
                        onClick={handleMapRegionClick}
                    />
                    <MapLayer
                        layerKey="circle-line"
                        layerOptions={linePointOptions}
                        onClick={handleMapRegionClick}
                    />
                </MapSource>
            )}
            {conflictsVisibility && pointGeojsonForConflicts && (
                <MapSource
                    sourceKey="point"
                    geoJson={pointGeojsonForConflicts}
                    sourceOptions={sourceOptions}
                >
                    <MapLayer
                        layerKey="circle-point"
                        layerOptions={pointLayerOptions}
                        onClick={handleMapRegionClick}
                    />
                </MapSource>
            )}
            {allElementsVisibility && areaGeojsonForAll && (
                <MapSource
                    sourceKey="area-all"
                    geoJson={areaGeojsonForAll}
                    sourceOptions={sourceOptions}
                >
                    <MapLayer
                        layerKey="fill-area-all"
                        layerOptions={areaFillLayerOptions}
                        onClick={handleMapRegionClick}
                    />
                    <MapLayer
                        layerKey="outline-area-all"
                        layerOptions={areaOutlineLayerOptions}
                        onClick={handleMapRegionClick}
                    />
                    <MapLayer
                        layerKey="circle-area-all"
                        layerOptions={linePointOptions}
                        onClick={handleMapRegionClick}
                    />
                </MapSource>
            )}
            {allElementsVisibility && lineGeojsonForAll && (
                <MapSource
                    sourceKey="line-all"
                    geoJson={lineGeojsonForAll}
                    sourceOptions={sourceOptions}
                >
                    <MapLayer
                        layerKey="outline-line-all"
                        layerOptions={lineLayerOptions}
                        onClick={handleMapRegionClick}
                    />
                    <MapLayer
                        layerKey="circle-line-all"
                        layerOptions={linePointOptions}
                        onClick={handleMapRegionClick}
                    />
                </MapSource>
            )}
            {allElementsVisibility && pointGeojsonForAll && (
                <MapSource
                    sourceKey="point-all"
                    geoJson={pointGeojsonForAll}
                    sourceOptions={sourceOptions}
                >
                    <MapLayer
                        layerKey="circle-point-all"
                        layerOptions={pointLayerOptions}
                        onClick={handleMapRegionClick}
                    />
                </MapSource>
            )}
            {(allElementsVisibility || conflictsVisibility) && (
                <div className={styles.legend}>
                    {legendItems.map(legendItem => (
                        <div
                            key={legendItem.title}
                            className={styles.legendItem}
                        >
                            <span
                                className={styles.legendColor}
                                style={{ backgroundColor: legendItem.color }}
                            />
                            <span>
                                {legendItem.title}
                            </span>
                        </div>
                    ))}
                </div>
            )}
            <LayerSwitcher
                className={styles.layerSwitcher}
                selected={selectedStyle}
                onSelectedLayerChange={setSelectedStyle}
            />
        </Map>
    );
}

export default createRequestClient(requestOptions)(DashboardMap);
