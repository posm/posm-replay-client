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
import LayerSwitcher from '#components/LayerSwitcher';

import Map from '#re-map';
import MapContainer from '#re-map/MapContainer';
import MapBounds from '#re-map/MapBounds';
import MapSource from '#re-map/MapSource';
import MapLayer from '#re-map/MapSource/MapLayer';
import MapTooltip from '#re-map/MapTooltip';

import Checkbox from '#components/Checkbox';
import MapStyleContext, { MapStyle } from '#components/LayerContext';
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


interface Region {
    tags: {
        [key: string]: string | undefined;
    };
}

interface ClickedRegion {
    feature: GeoJSON.Feature<GeoJSON.Polygon, Region>;
    lngLat: mapboxgl.LngLatLike;
}

function getUrl(title: string | undefined, body: string | undefined) {
    const url = new URL('https://github.com/posm/posm-replay-server/issues/new');
    if (title) {
        url.searchParams.set('title', `Error while ${title}`);
    }
    if (body) {
        url.searchParams.set('body', body);
    }
    url.searchParams.set('labels', 'bug-from-ui');

    return url.toString();
}

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
    'pushing_conflicts',
    'pushed_upstream',
}

const AOI_POLL_TIME = 3000;

const isNotStarted = (state: PosmStateEnum) => state <= PosmStateEnum.not_triggered;
const isConflicted = (state: PosmStateEnum) => state === PosmStateEnum.conflicts;
const isResolved = (state: PosmStateEnum) => state === PosmStateEnum.resolved;
const isPushing = (state: PosmStateEnum) => state === PosmStateEnum.pushing_conflicts;
const isPushed = (state: PosmStateEnum) => state === PosmStateEnum.pushed_upstream;

/*
const isAnalyzing = (state: PosmStateEnum) => (
    state > PosmStateEnum.not_triggered && state < PosmStateEnum.conflicts
);
*/

const tooltipOptions: mapboxgl.PopupOptions = {
    closeOnClick: true,
    closeButton: false,
    // offset: 8,
    maxWidth: '480px',
};

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
            'all', '#414141',
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
            'all', '#414141',
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
            'all', '#414141',
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
    {
        color: '#414141',
        title: 'Non Conflicted',
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
    allElements: ConflictsResponse,
) => {
    const pointFeatures: ElementGeoJSON[] = [];
    const lineFeatures: ElementGeoJSON[] = [];
    const areaFeatures: ElementGeoJSON[] = [];

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

interface PosmState {
    id: PosmStateEnum;
    name: string;
    hidden?: boolean;
    inanimate?: boolean;
}

interface PosmStatus {
    state: PosmStateEnum;
    isCurrentStateComplete?: boolean;
    hasErrored?: boolean;
    errorDetails?: string;
}

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
    selectedStyle: string;
    posmStatus: PosmStatus;
    posmStates: PosmState[];
    alreadyLoaded: boolean;
    allElementsVisibility: boolean;
    aoiInformation: AoiInformation;
    totalResolvedElements?: number;
    totalPartiallyResolvedElements?: number;
    bounds?: Bounds;
    conflictsVisibility: boolean;
    clickedRegionProperties: ClickedRegion | undefined;
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
    errorDetails?: string;
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
                errorDetails,
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
                errorDetails,
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
    nonConflictedElementsGet: {
        url: '/all-changes/?state=no-conflicts',
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
                errorDetails: undefined,
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
                errorDetails: undefined,
            });
        },
    },
    resetReplayTool: {
        url: '/reset/',
        method: methods.POST,
        onSuccess: ({ params }) => {
            if (!params || !params.setPosmStatus) {
                return;
            }
            params.setPosmStatus({
                state: PosmStateEnum.gathering_changesets,
                isCurrentStateComplete: false,
                hasErrored: false,
                errorDetails: undefined,
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
            selectedStyle: 'Wikimedia',
            conflictsVisibility: false,
            allElementsVisibility: false,
            posmStatus: {
                state: PosmStateEnum.not_triggered,
                isCurrentStateComplete: true,
                hasErrored: false,
                errorDetails: undefined,
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
                { id: PosmStateEnum.conflicts, name: 'Resolving conflicts', inanimate: true },
                { id: PosmStateEnum.resolved, name: 'Resolved conflicts', hidden: true },
                { id: PosmStateEnum.pushing_conflicts, name: 'Pushing resolved data to OSM' },
                { id: PosmStateEnum.pushed_upstream, name: 'Resolved data pushed to OSM', hidden: true },
            ],
            alreadyLoaded: false,

            clickedRegionProperties: undefined,
        };
    }

    private setFirstLoad = () => {
        this.setState({ alreadyLoaded: true });
    }

    private handlePushToUpstreamButton = () => {
        if (process.env.REACT_APP_OSM_URL) {
            window.location.href = process.env.REACT_APP_OSM_URL;
        }
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

    private handleShowNonConflictedCheckboxChange = (show: boolean) => {
        const {
            requests: {
                nonConflictedElementsGet,
            },
        } = this.props;

        if (show) {
            nonConflictedElementsGet.do();
        }
        this.setState({ allElementsVisibility: show });
    }

    private handleRetryButtonClick = () => {
        const {
            requests: { retriggerReplayTool },
        } = this.props;
        retriggerReplayTool.do({ setPosmStatus: this.setPosmStatus });
    }

    private handleResetButtonClick = () => {
        const {
            requests: { resetReplayTool },
        } = this.props;
        resetReplayTool.do({ setPosmStatus: this.setPosmStatus });
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
        const completedStates = visiblePosmStates.filter(
            item => item.id < posmStatus.state,
        );

        let totalCompleted = completedStates.length;

        if (posmStatus.isCurrentStateComplete) {
            const currentState = visiblePosmStates.find(
                item => item.id === posmStatus.state,
            );
            if (currentState && !currentState.hidden) {
                totalCompleted += 1;
            }
        }

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

        let stateStatus: Status = value.inanimate
            ? 'not-initiated'
            : 'pending';

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

    private handleStyleChange = (value: string) => {
        this.setState({ selectedStyle: value });
    }

    private handleTooltipClose = () => {
        this.setState({ clickedRegionProperties: undefined });
    }

    private handleMapRegionClick = (
        feature: mapboxgl.MapboxGeoJSONFeature,
        lngLat: mapboxgl.LngLat,
    ) => {
        const safeFeature = feature as unknown as GeoJSON.Feature<GeoJSON.Polygon, Region>;
        this.setState({
            clickedRegionProperties: {
                feature: {
                    ...safeFeature,
                    // FIXME: later
                    properties: {
                        ...safeFeature.properties,
                        tags: JSON.parse(feature.properties.tags),
                    },
                },
                lngLat,
            },
        });

        return true;
    }

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
                nonConflictedElementsGet: {
                    response: allElementsResponse,
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
            allElementsVisibility,
            selectedStyle,

            clickedRegionProperties,
        } = this.state;
        const { mapStyles } = this.context;

        let mapStyle = mapStyles.find((item: MapStyle) => item.name === selectedStyle);
        if (mapStyle === undefined) {
            [mapStyle] = mapStyles;
        }

        const notStartedStep = isNotStarted(posmStatus.state);
        const conflictedStep = isConflicted(posmStatus.state);
        const resolvedStep = isResolved(posmStatus.state);
        const pushingStep = isPushing(posmStatus.state);
        const pushedStep = isPushed(posmStatus.state);

        // const analyzing = isAnalyzing(posmStatus.state);

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
            allElementsResponse as ConflictsResponse,
        );

        const currentStateName = posmStates.find(item => item.id === posmStatus.state)?.name;

        const popupTags = clickedRegionProperties?.feature.properties.tags;

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
                                title="The replay tool has not been started!"
                            />
                        </>
                    )}
                    {!notStartedStep && (
                        <div className={styles.progress}>
                            <h3 className={styles.heading}>
                                Progress
                            </h3>
                            <ProgressBar
                                className={styles.progressBar}
                                progress={
                                    this.getPosmStateProgress(posmStates, posmStatus)
                                }
                            />
                            <ListView
                                className={styles.taskList}
                                data={this.getVisiblePosmStates(posmStates)}
                                renderer={TaskItem}
                                keySelector={this.taskItemKeySelector}
                                rendererParams={this.taskItemRendererParams}
                            />
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
                            {!posmStatus.hasErrored && (
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
                            )}
                            {!posmStatus.hasErrored && resolveDisabled && (
                                <Info
                                    className={styles.info}
                                    title="Resolve all conflicts to push changes to OSM"
                                />
                            )}
                        </div>
                    )}
                    {resolvedStep && (
                        <div className={styles.resolution}>
                            {!posmStatus.hasErrored && (
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
                                    <Button
                                        buttonType="button-primary"
                                        className={styles.pushToUpstreamButton}
                                        onClick={this.handlePushToUpstreamButton}
                                    >
                                        Push to OSM
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                    {pushingStep && (
                        <div className={styles.pushing}>
                            {!posmStatus.hasErrored && (
                                <div className={styles.actions}>
                                    <span>Indefinite progress</span>
                                </div>
                            )}
                        </div>
                    )}
                    {pushedStep && (
                        <div className={styles.pushed}>
                            {!posmStatus.hasErrored && (
                                <div className={styles.actions}>
                                    <Button
                                        className={styles.whatNextBUtton}
                                        disabled
                                        buttonType="button-primary"
                                    >
                                        What next?
                                    </Button>
                                </div>
                            )}
                            {!posmStatus.hasErrored && (
                                <Info
                                    className={styles.info}
                                    variant="success"
                                    title="All changes pushed to OSM. Get updated OSM data for this AOI from OSM."
                                />
                            )}
                        </div>
                    )}
                    {posmStatus.hasErrored && (
                        <>
                            <div className={styles.actions}>
                                <Button
                                    buttonType="button-primary"
                                    className={styles.retryButton}
                                    onClick={this.handleRetryButtonClick}
                                >
                                    Retry
                                </Button>
                                <Button
                                    buttonType="button-primary"
                                    className={styles.retryButton}
                                    onClick={this.handleResetButtonClick}
                                >
                                    Reset
                                </Button>
                            </div>
                            <Info
                                className={styles.info}
                                variant="danger"
                                title={currentStateName}
                                message={(
                                    <>
                                        <pre className={styles.code}>
                                            {posmStatus.errorDetails || 'Something went wrong!'}
                                        </pre>
                                        <a
                                            className={styles.link}
                                            href={getUrl(currentStateName, posmStatus.errorDetails)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Post this issue on github
                                        </a>
                                    </>
                                )}
                            />
                        </>
                    )}
                    <Checkbox
                        className={styles.nonConflictedCheckbox}
                        label="Show non-conflicted elements"
                        value={allElementsVisibility}
                        onChange={this.handleShowNonConflictedCheckboxChange}
                    />
                </div>
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
                    <MapContainer className={styles.map} />

                    {clickedRegionProperties && (
                        <MapTooltip
                            coordinates={clickedRegionProperties.lngLat}
                            tooltipOptions={tooltipOptions}
                            onHide={this.handleTooltipClose}
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

                    {conflictsVisibility && areaGeojson && (
                        <MapSource
                            sourceKey="area"
                            geoJson={areaGeojson}
                            sourceOptions={sourceOptions}
                        >
                            <MapLayer
                                layerKey="fill"
                                layerOptions={areaFillLayerOptions}
                                onClick={this.handleMapRegionClick}
                            />
                            <MapLayer
                                layerKey="outline"
                                layerOptions={areaOutlineLayerOptions}
                                onClick={this.handleMapRegionClick}
                            />
                            <MapLayer
                                layerKey="circle"
                                layerOptions={linePointOptions}
                                onClick={this.handleMapRegionClick}
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
                                onClick={this.handleMapRegionClick}
                            />
                            <MapLayer
                                layerKey="circle"
                                layerOptions={linePointOptions}
                                onClick={this.handleMapRegionClick}
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
                                onClick={this.handleMapRegionClick}
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
                        onSelectedLayerChange={this.handleStyleChange}
                    />
                </Map>
            </div>
        );
    }
}

Dashboard.contextType = MapStyleContext;

export default createConnectedRequestCoordinator<OwnProps>()(
    createRequestClient(requestOptions)(Dashboard),
);
