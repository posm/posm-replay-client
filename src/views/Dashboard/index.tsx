import React from 'react';
import { _cs } from '@togglecorp/fujs';
import memoize from 'memoize-one';
import { navigate } from '@reach/router';
import {
    bboxPolygon,
    area,
} from '@turf/turf';

import ListView from '#rsu/../v2/View/ListView';
import Button from '#rsu/../v2/Action/Button';
import Checkbox from '#components/Checkbox';
import ConflictStatus from '#components/ConflictStatus';
import TextOutput from '#components/TextOutput';
import FormattedDate from '#rscv/FormattedDate';
import Numeral from '#rscv/Numeral';
import Info from '#components/Info';
import LoadingAnimation from '#rscv/LoadingAnimation';
import ProgressBar from '#components/ProgressBar';
import TaskItem, { Status } from '#components/TaskItem';
import { Bounds } from '#constants/types';

import {
    createConnectedRequestCoordinator,
    createRequestClient,
    methods,
    NewProps,
    ClientAttributes,
} from '#request';

import pathNames from '#constants/pathNames';

import styles from './styles.scss';
import DashboardMap from './Map';

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

    'resolving_conflicts',
    'pushing_conflicts',
}

const AOI_POLL_TIME = 3000;

const isNotStarted = (state: PosmStateEnum) => state <= PosmStateEnum.not_triggered;

const isConflicted = (
    state: PosmStateEnum,
    isCurrentStateComplete?: boolean,
) => state === PosmStateEnum.resolving_conflicts && !isCurrentStateComplete;

const isResolved = (
    state: PosmStateEnum,
    isCurrentStateComplete?: boolean,
) => state === PosmStateEnum.resolving_conflicts && isCurrentStateComplete;

const isPushing = (
    state: PosmStateEnum,
    isCurrentStateComplete?: boolean,
) => state === PosmStateEnum.pushing_conflicts && !isCurrentStateComplete;

const isPushed = (
    state: PosmStateEnum,
    isCurrentStateComplete?: boolean,
) => state === PosmStateEnum.pushing_conflicts && isCurrentStateComplete;

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
    posmStatus: PosmStatus;
    posmStates: PosmState[];
    alreadyLoaded: boolean;
    allElementsVisibility: boolean;
    conflictsVisibility: boolean;
    aoiInformation: AoiInformation;
    totalResolvedElements?: number;
    totalPartiallyResolvedElements?: number;
    bounds?: Bounds;
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
            conflictsVisibility: false,
            allElementsVisibility: false,
            bounds: undefined,
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
                { id: PosmStateEnum.resolving_conflicts, name: 'Resolving conflicts' },
                { id: PosmStateEnum.pushing_conflicts, name: 'Pushing resolved data to OSM' },
            ],
            alreadyLoaded: false,
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
        const { bounds } = this.state;

        const {
            bounds: newBounds,
            totalResolvedElements,
            totalPartiallyResolvedElements,
        } = aoiInformation;


        if (JSON.stringify(bounds) !== JSON.stringify(newBounds)) {
            this.setState({
                bounds: aoiInformation.bounds,
                aoiInformation,
                totalResolvedElements,
                totalPartiallyResolvedElements,
            });
        } else {
            this.setState({
                aoiInformation,
                totalResolvedElements,
                totalPartiallyResolvedElements,
            });
        }
    }

    private setPosmStatus = (posmStatus: PosmStatus) => {
        this.setState({ posmStatus });
    }

    private handleStartButtonClick = () => {
        const {
            requests: { triggerReplayTool },
        } = this.props;
        triggerReplayTool.do({ setPosmStatus: this.setPosmStatus });
    }

    private handleShowConflictsButtonClick = (show: boolean) => {
        this.setState({ conflictsVisibility: show });
    }

    private handleShowNonConflictedCheckboxChange = (show: boolean) => {
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

    public render() {
        const {
            className,
            requests: {
                currentAoiGet: { pending },
            },
        } = this.props;

        const {
            aoiInformation: {
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
            totalResolvedElements,
            totalPartiallyResolvedElements,
        } = this.state;

        const notStartedStep = isNotStarted(posmStatus.state);
        const conflictedStep = isConflicted(posmStatus.state, posmStatus.isCurrentStateComplete);
        const resolvedStep = isResolved(posmStatus.state, posmStatus.isCurrentStateComplete);
        const pushingStep = isPushing(posmStatus.state, posmStatus.isCurrentStateComplete);
        const pushedStep = isPushed(posmStatus.state, posmStatus.isCurrentStateComplete);

        let conflictProgress = 0;
        if (totalResolvedElements && totalConflictingElements) {
            conflictProgress = 100 * (totalResolvedElements / totalConflictingElements);
        }
        const resolveDisabled = totalConflictingElements !== totalResolvedElements;

        const currentStateName = posmStates.find(item => item.id === posmStatus.state)?.name;

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
                        <div>
                            {!posmStatus.hasErrored && (
                                <div className={styles.actions}>
                                    <span>Indefinite progress</span>
                                </div>
                            )}
                        </div>
                    )}
                    {pushedStep && (
                        <div>
                            {!posmStatus.hasErrored && (
                                <div className={styles.actions}>
                                    <Button
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
                    {((conflictedStep || resolvedStep) && !posmStatus.hasErrored) && (
                        <div className={styles.checkboxesContainer}>
                            <Checkbox
                                label="Show conflicted elements"
                                value={conflictsVisibility}
                                onChange={this.handleShowConflictsButtonClick}
                            />
                            <Checkbox
                                label="Show non-conflicted elements"
                                value={allElementsVisibility}
                                onChange={this.handleShowNonConflictedCheckboxChange}
                            />
                        </div>
                    )}
                </div>
                <DashboardMap
                    className={styles.map}
                    bounds={bounds}
                    conflictsVisibility={conflictsVisibility}
                    allElementsVisibility={allElementsVisibility}
                    totalResolvedElements={totalResolvedElements}
                    totalPartiallyResolvedElements={totalPartiallyResolvedElements}
                />
            </div>
        );
    }
}

export default createConnectedRequestCoordinator<OwnProps>()(
    createRequestClient(requestOptions)(Dashboard),
);
