import React from 'react';
import { _cs } from '@togglecorp/fujs';
import memoize from 'memoize-one';
import { navigate } from '@reach/router';
import {
    center,
    bboxPolygon,
    area,
} from '@turf/turf';


import ListView from '#rsu/../v2/View/ListView';
import Button from '#rsu/../v2/Action/Button';

import Map from '#re-map';
import MapContainer from '#re-map/MapContainer';
import MapBounds from '#re-map/MapBounds';

import ConflictStatus from '#components/ConflictStatus';
import TextOutput from '#components/TextOutput';
import FormattedDate from '#rscv/FormattedDate';
import Numeral from '#rscv/Numeral';
import Info from '#components/Info';
import LoadingAnimation from '#rscv/LoadingAnimation';
import ProgressBar from '#components/ProgressBar';
import TaskItem, { Status } from '#components/TaskItem';

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

/*
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
 */

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

const speed = 0.6;

interface AoiInformation {
    name: string;
    description: string;
    bounds?: number[];
    area: number;
    dateCloned?: string;
    localChangesetsCount?: number;
    nodesCount?: number;
    waysCount?: number;
    relationsCount?: number;
    totalResolvedElements?: number;
    totalConflictingElements?: number;
}

interface State {
    posmStatus: PosmStatus;
    posmStates: PosmState[];
    alreadyLoaded: boolean;
    aoiInformation: AoiInformation;
}

interface OwnProps {
    className?: string;
}

interface Params {
    alreadyLoaded?: boolean;
    setFirstLoad?: () => void;
    setPosmStatus?: (posmStatus: PosmStatus) => void;
    setAoiInformation?: (aoiInformation: AoiInformation) => void;
}

type Props = NewProps<OwnProps, Params>;

const requestOptions: { [key: string]: ClientAttributes<OwnProps, Params> } = {
    currentAoiGet: {
        url: '/replay-tool/',
        method: methods.GET,
        onMount: true,
        onSuccess: ({
            params,
            response: {
                aoi: {
                    name,
                    description,
                    bounds,
                    dateCloned,
                    localChangesetsCount,
                    localElementsCount,
                    totalConflictingElements,
                    totalResolvedElements,
                } = {},
                state,
                isCurrentStateComplete,
                hasErrored,
            },
            props: {
                requests: {
                    currentAoiGet,
                },
            },
        }) => {
            if (!params) {
                return;
            }

            const {
                alreadyLoaded,
                setFirstLoad,
                setPosmStatus,
                setAoiInformation,
            } = params;

            if (!alreadyLoaded) {
                setFirstLoad();
            }

            setPosmStatus({
                // TODO: Fix this
                state: Number(PosmStateEnum[state]),
                isCurrentStateComplete,
                hasErrored,
            });

            setAoiInformation({
                name,
                description,
                area: bounds && (area(bboxPolygon(bounds)) / 1000000),
                bounds,
                dateCloned,
                localChangesetsCount,
                nodesCount: localElementsCount?.nodesCount,
                waysCount: localElementsCount?.waysCount,
                relationsCount: localElementsCount?.relationsCount,
                totalResolvedElements,
                totalConflictingElements,
            });

            setTimeout(() => currentAoiGet.do({ alreadyLoaded: true }), AOI_POLL_TIME);
        },
    },
    triggerReplayTool: {
        url: '/trigger/',
        method: methods.POST,
        onSuccess: ({ params: { setPosmStatus } }) => {
            setPosmStatus({
                state: PosmStateEnum.gathering_changesets,
                isCurrentStateComplete: false,
                hasErrored: false,
            });
        },
    },
    retriggerReplayTool: {
        url: '/re-trigger/',
        method: methods.POST,
        onSuccess: ({ params: { setPosmStatus } }) => {
            setPosmStatus({
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
                bounds: undefined,
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

    private createMapOptions = (bounds: number[]) => {
        if (!bounds) {
            return {};
        }
        return {
            bounds,
            zoomLevel: 3,
            center: center(bboxPolygon(bounds)),
        };
    }

    private setAoiInformation = (aoiInformation: AoiInformation) => {
        this.setState({ aoiInformation });
    }

    private setPosmStatus = (posmStatus: PosmStatus) => {
        this.setState({ posmStatus });
    }

    private handleStartButtonClick = () => {
        const {
            requests: {
                triggerReplayTool,
            },
        } = this.props;
        triggerReplayTool.do({ setPosmStatus: this.setPosmStatus });
    }

    private handleRetryButtonClick = () => {
        const {
            requests: {
                retriggerReplayTool,
            },
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

    private handlePushToUpstreamButton = () => {
        console.log('Push to upstream');
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

    private taskItemRendererParams = (key: PosmStateEnum, value: PosmState) => {
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
            className: styles.tasksItem,
            status: stateStatus,
            label: value.name,
        };
    };

    public render() {
        const {
            className,
            requests: {
                currentAoiGet: {
                    pending,
                },
            },
        } = this.props;

        const {
            aoiInformation,
            posmStatus,
            posmStates,
            alreadyLoaded,
        } = this.state;

        const notStartedStep = isNotStarted(posmStatus.state);
        const conflictedStep = isConflicted(posmStatus.state);
        const analyzing = isAnalyzing(posmStatus.state);
        const resolvedStep = isResolved(posmStatus.state);
        const mapOptions = this.createMapOptions(aoiInformation.bounds);

        const conflict = {
            resolvedCount: aoiInformation.totalResolvedElements,
            totalCount: aoiInformation.totalConflictingElements,
        };

        const conflictProgress = 100 * (conflict.resolvedCount / conflict.totalCount);
        const resolveDisabled = conflict.totalCount !== conflict.resolvedCount;

        return (
            <div className={_cs(className, styles.dashboard)}>
                <div className={styles.sidebar}>
                    {(!alreadyLoaded && pending) && <LoadingAnimation />}
                    <header className={styles.header}>
                        <h2 className={styles.heading}>
                            { aoiInformation.name }
                        </h2>
                        <div
                            className={styles.description}
                            title={aoiInformation.description}
                        >
                            {aoiInformation.description}
                        </div>
                    </header>
                    <div className={styles.details}>
                        <TextOutput
                            label="Area"
                            value={(
                                <Numeral
                                    value={aoiInformation.area}
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
                                    value={aoiInformation.dateCloned}
                                />
                            )}
                        />
                        <TextOutput
                            label="Local changesets"
                            value={aoiInformation.localChangesetsCount}
                        />
                        <TextOutput
                            label="Nodes"
                            value={aoiInformation.nodesCount}
                        />
                        <TextOutput
                            label="Ways"
                            value={aoiInformation.waysCount}
                        />
                        <TextOutput
                            label="Relations"
                            value={aoiInformation.relationsCount}
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
                                total={conflict.totalCount}
                                resolved={conflict.resolvedCount}
                            />
                            <div className={styles.actions}>
                                <Button
                                    buttonType="button-primary"
                                    className={styles.resolveConflictButton}
                                    onClick={this.handleResolveConflictButtonClick}
                                    // disabled={resolveDisabled}
                                >
                                    Show Conflicts
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
                        bounds={aoiInformation.bounds}
                        padding={50}
                    />
                    <MapContainer
                        className={styles.map}
                    />
                </Map>
            </div>
        );
    }
}

export default createConnectedRequestCoordinator<OwnProps>()(
    createRequestClient(requestOptions)(Dashboard),
);
