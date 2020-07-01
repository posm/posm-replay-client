import React from 'react';
import {
    _cs,
    isDefined,
    doesObjectHaveNoData,
} from '@togglecorp/fujs';
import memoize from 'memoize-one';
import { navigate } from '@reach/router';
import {
    bboxPolygon,
    area,
} from '@turf/turf';

import ListView from '#rsu/../v2/View/ListView';
import Button from '#rsu/../v2/Action/Button';
import Checkbox from '#rsu/../v2/Input/Checkbox';

import Map from '#re-map';
import MapContainer from '#re-map/MapContainer';
import MapBounds from '#re-map/MapBounds';
import MapSource from '#re-map/MapSource';
import MapLayer from '#re-map/MapSource/MapLayer';

import ConflictStatus from '#components/ConflictStatus';
import TextOutput from '#components/TextOutput';
import FormattedDate from '#rscv/FormattedDate';
import Numeral from '#rscv/Numeral';
import Info from '#components/Info';
import LoadingAnimation from '#rscv/LoadingAnimation';
import ProgressBar from '#components/ProgressBar';
import TaskItem, { Status } from '#components/TaskItem';
import {
    Bounds,
    ShapeType,
    ConflictElement,
    ResolutionStatus,
    ElementGeoJSON,
} from '#constants/types';

import {
    createConnectedRequestCoordinator,
    createRequestClient,
    methods,
    NewProps,
    ClientAttributes,
} from '#request';

import pathNames from '#constants/pathNames';

import styles from './styles.scss';

enum PosmStateEnum {
    'not_triggered',
    'gathering_changesets',
    'extracting_upstream_aoi',
    'extracting_local_aoi',

    // newly added
    'detecting_conflicts',
    'creating_geojsons',

    'conflicts',
    'resolved',
    'push_conflicts',
    'pushed_upstream',
}

const AOI_POLL_TIME = 3000;

const isNotStarted = (state: PosmStateEnum) => state <= PosmStateEnum.not_triggered;
const isAnalyzing = (state: PosmStateEnum) => (
    state > PosmStateEnum.not_triggered && state < PosmStateEnum.conflicts
);
const isConflicted = (state: PosmStateEnum) => state === PosmStateEnum.conflicts;
const isResolved = (state: PosmStateEnum) => state === PosmStateEnum.resolved;

const sourceOptions: mapboxgl.GeoJSONSourceRaw = {
    type: 'geojson',
};

const areaFillLayerOptions: mapboxgl.Layer = {
    id: 'not-required',
    type: 'fill',
    paint: {
        'fill-color': [
            'match',
            ['get', 'resolution'],
            'resolved', 'green',
            'partially_resolved', 'yellow',
            'unresolved', 'red',
            'black',
        ],
        'fill-opacity': 0.5,
    },
};
const areaOutlineLayerOptions: mapboxgl.Layer = {
    id: 'not-required',
    type: 'line',
    paint: {
        'line-color': 'black',
        'line-opacity': 0.8,
        'line-width': 3,
    },
};
const linePointOptions: mapboxgl.Layer = {
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
        'circle-radius': 3,
        'circle-stroke-width': 1,
        'circle-stroke-color': 'black',
        'circle-stroke-opacity': 0.5,
    },
};

const lineLayerOptions: mapboxgl.Layer = {
    id: 'not-required',
    type: 'line',
    paint: {
        'line-color': [
            'match',
            ['get', 'resolution'],
            'resolved', 'green',
            'partially_resolved', 'yellow',
            'unresolved', 'red',
            'black',
        ],
        'line-opacity': 0.8,
        'line-width': 5,
    },
};

const pointLayerOptions: mapboxgl.Layer = {
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

const legendItems = [
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
];

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

const getSeggregatedGeojsons = (
    resolved: ConflictsResponse,
    partiallyResolved: ConflictsResponse,
    unresolved: ConflictsResponse,
) => {
    const pointFeatures: ElementGeoJSON[] = [];
    const lineFeatures: ElementGeoJSON[] = [];
    const areaFeatures: ElementGeoJSON[] = [];

    function getFeatures(conflictElements: ConflictElement[], status: ResolutionStatus) {
        const filteredConflictElements = conflictElements
            .filter(element => element.status === status);

        function getGeoJson(element: ConflictElement, elementStatus: ResolutionStatus) {
            const geoJson = element.localGeojson && !doesObjectHaveNoData(element.localGeojson)
                ? element.localGeojson
                : element.originalGeojson;

            return {
                ...geoJson,
                properties: {
                    ...geoJson.properties,
                    resolution: elementStatus,
                },
            };
        }

        const points: ElementGeoJSON[] = filteredConflictElements
            .filter(element => getShapeType(element.originalGeojson) === 'point')
            .map(element => getGeoJson(element, status));

        const lines: ElementGeoJSON[] = filteredConflictElements
            .filter(element => getShapeType(element.originalGeojson) === 'line')
            .map(element => getGeoJson(element, status));

        const areas: ElementGeoJSON[] = filteredConflictElements
            .filter(element => getShapeType(element.originalGeojson) === 'area')
            .map(element => getGeoJson(element, status));

        return [points, lines, areas];
    }

    if (isDefined(resolved?.results)) {
        const [points, lines, areas] = getFeatures(resolved.results, 'resolved');
        pointFeatures.push(...points);
        lineFeatures.push(...lines);
        areaFeatures.push(...areas);
    }

    if (isDefined(partiallyResolved?.results)) {
        const [points, lines, areas] = getFeatures(partiallyResolved.results, 'partially_resolved');
        pointFeatures.push(...points);
        lineFeatures.push(...lines);
        areaFeatures.push(...areas);
    }

    if (isDefined(unresolved?.results)) {
        const [points, lines, areas] = getFeatures(unresolved.results, 'unresolved');
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

interface PosmState {
    id: PosmStateEnum;
    name: string;
    hidden?: boolean;
}

interface PosmStatus {
    state: PosmStateEnum;
    isCurrentStateComplete?: boolean;
    hasErrored?: boolean;
}

const mapStyle: mapboxgl.MapboxOptions['style'] = {
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
};

interface LocalElementsCount {
    waysCount: number;
    nodesCount: number;
    relationsCount: number;
}

interface AoiInformation {
    name: string;
    description: string;
    area?: number;
    dateCloned?: string;
    bounds?: Bounds;
    localChangesetsCount?: number;
    nodesCount?: number;
    waysCount?: number;
    relationsCount?: number;
    totalResolvedElements?: number;
    totalPartiallyResolvedElements?: number;
    totalConflictingElements?: number;
    localElementsCount?: LocalElementsCount;
}

interface State {
    posmStatus: PosmStatus;
    posmStates: PosmState[];
    alreadyLoaded: boolean;
    aoiInformation: AoiInformation;
    totalResolvedElements?: number;
    totalPartiallyResolvedElements?: number;
    bounds?: Bounds;
    conflictsVisibility: boolean;
}

interface OwnProps {
    className?: string;
}

interface Params {
    alreadyLoaded?: boolean;
    setFirstLoad?: () => void;
    setPosmStatus?: (posmStatus: PosmStatus) => void;
    setAoiInformation?: (aoiInformation: AoiInformation) => void;
    delay?: number;
}

interface Response {
    aoi: AoiInformation;
    state: keyof typeof PosmStateEnum;
    isCurrentStateComplete: boolean;
    hasErrored: boolean;
}

type Props = NewProps<OwnProps, Params>;

const requestOptions: { [key: string]: ClientAttributes<OwnProps, Params> } = {
    currentAoiGet: {
        url: '/replay-tool/',
        method: methods.GET,
        onMount: true,
        options: ({ params }) => {
            if (!params || !params.delay) {
                return undefined;
            }
            return {
                delay: params.delay,
            };
        },
        onSuccess: ({
            params,
            response,
            props: {
                requests: { currentAoiGet },
            },
        }) => {
            if (!params) {
                return;
            }
            const {
                aoi: {
                    name,
                    description,
                    bounds,
                    dateCloned,
                    localChangesetsCount,
                    localElementsCount,
                    totalConflictingElements,
                    totalResolvedElements,
                    totalPartiallyResolvedElements,
                },
                state,
                isCurrentStateComplete,
                hasErrored,
            } = response as Response;

            const {
                alreadyLoaded,
                setFirstLoad,
                setPosmStatus,
                setAoiInformation,
            } = params;

            if (!alreadyLoaded && setFirstLoad) {
                setFirstLoad();
            }

            if (!setPosmStatus) {
                return;
            }

            setPosmStatus({
                state: PosmStateEnum[state],
                isCurrentStateComplete,
                hasErrored,
            });

            if (!setAoiInformation) {
                return;
            }

            setAoiInformation({
                name,
                description,
                bounds,
                area: bounds && (area(bboxPolygon(bounds)) / 1000000),
                dateCloned,
                localChangesetsCount,
                nodesCount: localElementsCount?.nodesCount,
                waysCount: localElementsCount?.waysCount,
                relationsCount: localElementsCount?.relationsCount,
                totalResolvedElements,
                totalPartiallyResolvedElements,
                totalConflictingElements,
            });

            currentAoiGet.do({
                alreadyLoaded: true,
                delay: AOI_POLL_TIME,
            });
        },
    },
    unresolvedConflictsGet: {
        url: '/unresolved-elements/',
        method: methods.GET,
    },
    partiallyResolvedConflictsGet: {
        url: '/partial-resolved-elements/',
        method: methods.GET,
    },
    resolvedConflictsGet: {
        url: '/resolved-elements/',
        method: methods.GET,
    },
    triggerReplayTool: {
        url: '/trigger/',
        method: methods.POST,
        onSuccess: ({ params }) => {
            if (!params || !params.setPosmStatus) {
                return;
            }
            params.setPosmStatus({
                state: PosmStateEnum.gathering_changesets,
                isCurrentStateComplete: false,
                hasErrored: false,
            });
        },
    },
    retriggerReplayTool: {
        url: '/re-trigger/',
        method: methods.POST,
        onSuccess: ({ params }) => {
            if (!params || !params.setPosmStatus) {
                return;
            }
            params.setPosmStatus({
                state: PosmStateEnum.gathering_changesets,
                isCurrentStateComplete: false,
                hasErrored: false,
            });
        },
    },
};

class Dashboard extends React.PureComponent<Props, State> {
    public constructor(props: Props) {
        super(props);

        const {
            requests: {
                currentAoiGet,
            },
        } = this.props;

        currentAoiGet.setDefaultParams({
            setAoiInformation: this.setAoiInformation,
            setFirstLoad: this.setFirstLoad,
            setPosmStatus: this.setPosmStatus,
            alreadyLoaded: false,
        });

        this.state = {
            bounds: undefined,
            conflictsVisibility: false,
            posmStatus: {
                state: PosmStateEnum.not_triggered,
                isCurrentStateComplete: true,
                hasErrored: false,
            },
            aoiInformation: {
                name: '-',
                description: '-',
                area: 0,
                dateCloned: undefined,
                localChangesetsCount: 0,
                nodesCount: 0,
                waysCount: 0,
                relationsCount: 0,
            },
            posmStates: [
                { id: PosmStateEnum.not_triggered, name: 'Not Triggered', hidden: true },
                { id: PosmStateEnum.gathering_changesets, name: 'Gathering Changesets' },
                { id: PosmStateEnum.extracting_upstream_aoi, name: 'Extracting Upstream AOI' },
                { id: PosmStateEnum.extracting_local_aoi, name: 'Extracting Local AOI' },
                { id: PosmStateEnum.detecting_conflicts, name: 'Identifying conflicts' },
                { id: PosmStateEnum.creating_geojsons, name: 'Creating GeoJSONs' },
                { id: PosmStateEnum.conflicts, name: 'Conflicts identified', hidden: true },
                { id: PosmStateEnum.resolved, name: 'Conflicts resolved', hidden: true },
                { id: PosmStateEnum.push_conflicts, name: 'Pushing conflicts', hidden: true },
                { id: PosmStateEnum.pushed_upstream, name: 'Pushing resolved data to OSM', hidden: true },
            ],
            alreadyLoaded: false,
        };
    }

    private setFirstLoad = () => {
        this.setState({ alreadyLoaded: true });
    }

    private handlePushToUpstreamButton = () => {
        console.warn('auth action goes here');
    }

    private createMapOptions = memoize((bounds?: Bounds) => {
        if (!bounds) {
            return {};
        }
        // const centerPoint = center(bboxPolygon(bounds));
        return {
            bounds,
            zoomLevel: 3,
            // NOTE: we may not need center if we have bounds
            // center: centerPoint,
        };
    });

    private setAoiInformation = (aoiInformation: AoiInformation) => {
        const {
            conflictsVisibility,
            bounds,
            totalResolvedElements,
            totalPartiallyResolvedElements,
        } = this.state;

        const {
            requests: {
                unresolvedConflictsGet,
                partiallyResolvedConflictsGet,
                resolvedConflictsGet,
            },
        } = this.props;

        const {
            bounds: newBounds,
            totalResolvedElements: newTotalResolvedElements,
            totalPartiallyResolvedElements: newTotalPartiallyResolvedElements,
        } = aoiInformation;

        if (
            conflictsVisibility
            && (
                totalResolvedElements !== newTotalResolvedElements
                || totalPartiallyResolvedElements !== newTotalPartiallyResolvedElements
            )
        ) {
            unresolvedConflictsGet.do();
            partiallyResolvedConflictsGet.do();
            resolvedConflictsGet.do();
        }

        if (JSON.stringify(bounds) !== JSON.stringify(newBounds)) {
            this.setState({
                bounds: aoiInformation.bounds,
                aoiInformation,
                totalResolvedElements: newTotalResolvedElements,
                totalPartiallyResolvedElements: newTotalPartiallyResolvedElements,
            });
        } else {
            this.setState({
                aoiInformation,
                totalResolvedElements: newTotalResolvedElements,
                totalPartiallyResolvedElements: newTotalPartiallyResolvedElements,
            });
        }
    }

    private setPosmStatus = (posmStatus: PosmStatus) => {
        this.setState({ posmStatus });
    }

    private getSeggregatedGeojsons = memoize(getSeggregatedGeojsons);

    private handleStartButtonClick = () => {
        const {
            requests: { triggerReplayTool },
        } = this.props;
        triggerReplayTool.do({ setPosmStatus: this.setPosmStatus });
    }

    private handleShowConflictsButtonClick = (show: boolean) => {
        const {
            requests: {
                unresolvedConflictsGet,
                partiallyResolvedConflictsGet,
                resolvedConflictsGet,
            },
        } = this.props;

        if (show) {
            unresolvedConflictsGet.do();
            partiallyResolvedConflictsGet.do();
            resolvedConflictsGet.do();
        }
        this.setState({ conflictsVisibility: show });
    }

    private handleRetryButtonClick = () => {
        const {
            requests: { retriggerReplayTool },
        } = this.props;
        retriggerReplayTool.do({ setPosmStatus: this.setPosmStatus });
    }

    /*
    private handleResolveConflictButtonClick = () => {
        this.setState({
            posmStatus: { state: PosmStateEnum.resolved, isCurrentStateComplete: true },
        });
    }
    */

    private handleResolveConflictButtonClick = () => {
        navigate(pathNames.conflictResolution);
    }

    private getVisiblePosmStates = memoize((posmStates: PosmState[]) => (
        posmStates.filter(item => !item.hidden)
    ))

    private getPosmStateProgress = (posmStates: PosmState[], posmStatus: PosmStatus) => {
        const visiblePosmStates = this.getVisiblePosmStates(posmStates);
        const completedStates = visiblePosmStates.filter(item => item.id < posmStatus.state);
        const totalCompleted = completedStates.length + (posmStatus.isCurrentStateComplete ? 1 : 0);
        return 100 * (totalCompleted / visiblePosmStates.length);
    }

    private taskItemKeySelector = (item: PosmState) => item.id;

    private taskItemRendererParams = (_: PosmStateEnum, value: PosmState) => {
        const {
            posmStatus: {
                state,
                hasErrored,
                isCurrentStateComplete,
            },
        } = this.state;

        let stateStatus: Status = 'pending';
        if (value.id < state) {
            stateStatus = 'completed';
        } else if (value.id > state) {
            stateStatus = 'not-initiated';
        } else if (hasErrored) {
            stateStatus = 'failed';
        } else if (isCurrentStateComplete) {
            stateStatus = 'completed';
        }

        return {
            status: stateStatus,
            label: value.name,
        };
    };

    public render() {
        const {
            className,
            requests: {
                currentAoiGet: { pending },
                unresolvedConflictsGet: {
                    response: unresolvedConflictsResponse,
                },
                resolvedConflictsGet: {
                    response: resolvedConflictsResponse,
                },
                partiallyResolvedConflictsGet: {
                    response: partiallyResolvedConflictsResponse,
                },
            },
        } = this.props;

        const {
            aoiInformation: {
                totalResolvedElements,
                totalConflictingElements,
                name,
                description,
                area: aoiArea,
                dateCloned,
                localChangesetsCount,
                nodesCount,
                waysCount,
                relationsCount,
            },
            bounds,
            posmStatus,
            posmStates,
            alreadyLoaded,
            conflictsVisibility,
        } = this.state;

        const notStartedStep = isNotStarted(posmStatus.state);
        const conflictedStep = isConflicted(posmStatus.state);
        const analyzing = isAnalyzing(posmStatus.state);
        const resolvedStep = isResolved(posmStatus.state);
        const mapOptions = this.createMapOptions(bounds);

        let conflictProgress = 0;
        if (totalResolvedElements && totalConflictingElements) {
            conflictProgress = 100 * (totalResolvedElements / totalConflictingElements);
        }
        const resolveDisabled = totalConflictingElements !== totalResolvedElements;

        const {
            lineGeojson,
            pointGeojson,
            areaGeojson,
        } = this.getSeggregatedGeojsons(
            resolvedConflictsResponse as ConflictsResponse,
            partiallyResolvedConflictsResponse as ConflictsResponse,
            unresolvedConflictsResponse as ConflictsResponse,
        );

        return (
            <div className={_cs(className, styles.dashboard)}>
                <div className={styles.sidebar}>
                    {(!alreadyLoaded && pending) && <LoadingAnimation />}
                    <header className={styles.header}>
                        <h2 className={styles.heading}>
                            { name }
                        </h2>
                        <div
                            className={styles.description}
                            title={description}
                        >
                            {description}
                        </div>
                    </header>
                    <div className={styles.details}>
                        <TextOutput
                            label="Area"
                            value={(
                                <Numeral
                                    value={aoiArea}
                                    precision={2}
                                    suffix=" sq. km"
                                />
                            )}
                        />
                        <TextOutput
                            label="Date cloned"
                            value={(
                                <FormattedDate
                                    mode="dd-MM-yyyy"
                                    value={dateCloned}
                                />
                            )}
                        />
                        <TextOutput
                            label="Local changesets"
                            value={localChangesetsCount}
                        />
                        <TextOutput
                            label="Nodes"
                            value={nodesCount}
                        />
                        <TextOutput
                            label="Ways"
                            value={waysCount}
                        />
                        <TextOutput
                            label="Relations"
                            value={relationsCount}
                        />
                    </div>

                    {notStartedStep && (
                        <>
                            <div className={styles.actions}>
                                <Button
                                    buttonType="button-primary"
                                    className={styles.startButton}
                                    onClick={this.handleStartButtonClick}
                                >
                                    Start
                                </Button>
                            </div>
                            <Info
                                className={styles.info}
                                message="The replay tool has not been started!"
                            />
                        </>
                    )}

                    {!notStartedStep && (
                        <div className={styles.progress}>
                            <h3 className={styles.heading}>
                                Progress
                            </h3>
                            <ListView
                                className={styles.taskList}
                                data={this.getVisiblePosmStates(posmStates)}
                                renderer={TaskItem}
                                keySelector={this.taskItemKeySelector}
                                rendererParams={this.taskItemRendererParams}
                            />
                            {analyzing && (
                                <ProgressBar
                                    className={styles.progressBar}
                                    progress={
                                        this.getPosmStateProgress(posmStates, posmStatus)
                                    }
                                />
                            )}
                            {(analyzing && posmStatus.hasErrored) && (
                                <div className={styles.actions}>
                                    <Button
                                        buttonType="button-primary"
                                        className={styles.retryButton}
                                        onClick={this.handleRetryButtonClick}
                                    >
                                        Retry
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {conflictedStep && (
                        <div className={styles.conflicts}>
                            <h3 className={styles.heading}>
                                Conflicts
                            </h3>
                            <ProgressBar
                                className={styles.progressBar}
                                progress={conflictProgress}
                            />
                            <ConflictStatus
                                className={styles.conflictStatus}
                                total={totalConflictingElements}
                                resolved={totalResolvedElements}
                            />
                            <div className={styles.actions}>
                                <Checkbox
                                    className={styles.checkboxOne}
                                    label="Show Conflicts in Map"
                                    value={conflictsVisibility}
                                    onChange={this.handleShowConflictsButtonClick}
                                />
                                <Button
                                    buttonType="button-primary"
                                    className={styles.resolveConflictButton}
                                    onClick={this.handleResolveConflictButtonClick}
                                    // disabled={resolveDisabled}
                                >
                                    Go to Conflicts
                                </Button>
                            </div>
                            {resolveDisabled && (
                                <Info
                                    className={styles.info}
                                    message="Resolve all conflicts to push changes to OSM"
                                />
                            )}
                        </div>
                    )}
                    {resolvedStep && (
                        <div className={styles.resolution}>
                            <div className={styles.actions}>
                                <Checkbox
                                    className={styles.checkboxOne}
                                    label="Show Conflicts in Map"
                                    value={conflictsVisibility}
                                    onChange={this.handleShowConflictsButtonClick}
                                />
                                <Button
                                    buttonType="button-primary"
                                    className={styles.pushToUpstreamButton}
                                    onClick={this.handlePushToUpstreamButton}
                                >
                                    Push to OSM
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
                <Map
                    mapStyle={mapStyle}
                    mapOptions={mapOptions}
                    scaleControlShown
                    navControlShown
                >
                    <MapBounds
                        bounds={bounds}
                        padding={50}
                    />
                    <MapContainer className={styles.map} />
                    {conflictsVisibility && areaGeojson && (
                        <MapSource
                            sourceKey="area"
                            geoJson={areaGeojson}
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
                    {conflictsVisibility && lineGeojson && (
                        <MapSource
                            sourceKey="line"
                            geoJson={lineGeojson}
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
                    {conflictsVisibility && pointGeojson && (
                        <MapSource
                            sourceKey="point"
                            geoJson={pointGeojson}
                            sourceOptions={sourceOptions}
                        >
                            <MapLayer
                                layerKey="circle"
                                layerOptions={pointLayerOptions}
                            />
                        </MapSource>
                    )}
                    {conflictsVisibility && (
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
                                    <span className={styles.legendTitle}>
                                        {legendItem.title}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </Map>
            </div>
        );
    }
}

export default createConnectedRequestCoordinator<OwnProps>()(
    createRequestClient(requestOptions)(Dashboard),
);
