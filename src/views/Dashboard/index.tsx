import React from 'react';
import { _cs } from '@togglecorp/fujs';
import memoize from 'memoize-one';

import ListView from '#rsu/../v2/View/ListView';
import Button from '#rsu/../v2/Action/Button';

import Map from '#re-map';
import MapContainer from '#re-map/MapContainer';
import MapBounds from '#re-map/MapBounds';

import ConflictStatus from '#components/ConflictStatus';
import TextOutput from '#components/TextOutput';
import Info from '#components/Info';
import ProgressBar from '#components/ProgressBar';
import TaskItem, { Status } from '#components/TaskItem';

import styles from './styles.scss';

enum PosmStateEnum {
    'not_triggered',
    'gathering_changesets',
    'extracting_upstream_aoi',
    'extracting_local_aoi',
    'filtering_referenced_osm_elements',
    'conflicts',
    'resolved',
    'push_conflicts',
    'pushed_upstream',
}
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

const nepalCenter: [number, number] = [
    84.1240, 28.3949,
];

/*
const nepalBounds: [number, number, number, number] = [
    80.05858661752784, 26.347836996368667,
    88.20166918432409, 30.44702867091792,
];
*/

const lalitpurBounds: [number, number, number, number] = [
    85.31066555023207,
    27.67117097577173,
    85.32710212707534,
    27.682648488328013,
];

const mapOptions = {
    zoomLevel: 3,
    center: nepalCenter,
    bounds: lalitpurBounds,
};

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


interface State {
    posmStatus: PosmStatus;
    posmStates: PosmState[];
}
interface Props {
    className?: string;
}

class Dashboard extends React.PureComponent<Props, State> {
    public constructor(props: Props) {
        super(props);

        this.state = {
            posmStatus: {
                state: PosmStateEnum.not_triggered,
                isCurrentStateComplete: true,
                hasErrored: false,
            },
            posmStates: [
                { id: PosmStateEnum.not_triggered, name: 'Not Triggered', hidden: true },
                { id: PosmStateEnum.gathering_changesets, name: 'Gathering Changesets' },
                { id: PosmStateEnum.extracting_upstream_aoi, name: 'Extracting Upstream AOI' },
                { id: PosmStateEnum.extracting_local_aoi, name: 'Extracting Local AOI' },
                { id: PosmStateEnum.filtering_referenced_osm_elements, name: 'Identifying conflicts' },
                { id: PosmStateEnum.conflicts, name: 'Conflicts identified', hidden: true },
                { id: PosmStateEnum.resolved, name: 'Conflicts resolved', hidden: true },
                { id: PosmStateEnum.push_conflicts, name: 'Pushing conflicts', hidden: true },
                { id: PosmStateEnum.pushed_upstream, name: 'Pushing resolved data to OSM', hidden: true },
            ],
        };
    }

    private handleStartButtonClick = () => {
        this.setState({
            posmStatus: { state: PosmStateEnum.gathering_changesets },
        });
        setTimeout(
            () => {
                this.setState({
                    posmStatus: { state: PosmStateEnum.extracting_upstream_aoi },
                });
            },
            1000,
        );
        setTimeout(
            () => {
                this.setState({
                    posmStatus: { state: PosmStateEnum.extracting_local_aoi },
                });
            },
            2000,
        );
        setTimeout(
            () => {
                this.setState({
                    posmStatus: { state: PosmStateEnum.filtering_referenced_osm_elements },
                });
            },
            4000,
        );
        setTimeout(
            () => {
                this.setState({
                    posmStatus: {
                        state: PosmStateEnum.filtering_referenced_osm_elements,
                        hasErrored: true,
                    },
                });
            },
            5000,
        );
    }

    private handleRetryButtonClick = () => {
        this.setState({
            posmStatus: { state: PosmStateEnum.filtering_referenced_osm_elements },
        });
        setTimeout(
            () => {
                this.setState({
                    posmStatus: { state: PosmStateEnum.conflicts },
                });
            },
            3000,
        );
    }

    private handleResolveConflictButtonClick = () => {
        this.setState({
            posmStatus: { state: PosmStateEnum.resolved, isCurrentStateComplete: true },
        });
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
                isCurrentStateComplete,
                hasErrored,
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
        } = this.props;
        const {
            posmStatus,
            posmStates,
        } = this.state;

        const aoi = {
            name: 'Jawalakhel',
            description: 'It is best known for its rich cultural heritage, particularly its tradition of arts and crafts. It is called city of festival and feast, fine ancient art, making of metallic and stone carving statue.',
            area: 12000,
            dateExtracted: '2019-12-02',
            bounds: lalitpurBounds,
            totalChangesets: 13,
            nodes: 12121,
            ways: 1938,
            relations: 12,
        };

        const notStartedStep = isNotStarted(posmStatus.state);
        const conflictedStep = isConflicted(posmStatus.state);
        const analyzing = isAnalyzing(posmStatus.state);
        const resolvedStep = isResolved(posmStatus.state);

        const conflict = {
            resolvedCount: 3,
            totalCount: 35,
        };
        const conflictProgress = 100 * (conflict.resolvedCount / conflict.totalCount);
        const resolveDisabled = conflict.totalCount !== conflict.resolvedCount;

        return (
            <div className={_cs(className, styles.dashboard)}>
                <div className={styles.sidebar}>
                    <header className={styles.header}>
                        <h2 className={styles.heading}>
                            { aoi.name }
                        </h2>
                        <div
                            className={styles.description}
                            title={aoi.description}
                        >
                            {aoi.description}
                        </div>
                    </header>
                    <div className={styles.details}>
                        <TextOutput
                            label="Area"
                            value={aoi.area}
                        />
                        <TextOutput
                            label="Date extracted"
                            value={aoi.dateExtracted}
                        />
                        <TextOutput
                            label="Local changesets"
                            value={aoi.totalChangesets}
                        />
                        <TextOutput
                            label="Nodes"
                            value={aoi.nodes}
                        />
                        <TextOutput
                            label="Ways"
                            value={aoi.ways}
                        />
                        <TextOutput
                            label="Relations"
                            value={aoi.relations}
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
                                    progress={this.getPosmStateProgress(posmStates, posmStatus)}
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
                                    Resolve conflicts
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
                        bounds={mapOptions.bounds}
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

export default Dashboard;
