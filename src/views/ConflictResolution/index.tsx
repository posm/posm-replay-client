import React from 'react';
import { _cs } from '@togglecorp/fujs';
import produce from 'immer';

import ListView from '#rsu/../v2/View/ListView';
import ProgressBar from '#components/ProgressBar';
import LoadingAnimation from '#rscv/LoadingAnimation';
import ConflictStatus from '#components/ConflictStatus';
import {
    BasicConflictElement,
    ResolutionStatus,
    Bounds,
} from '#constants/types';

import {
    createConnectedRequestCoordinator,
    createRequestClient,
    methods,
    NewProps,
    ClientAttributes,
} from '#request';

import ConflictListItem from './ConflictListItem';
import Conflict from './Conflict';

import styles from './styles.scss';

interface State {
    conflicts: BasicConflictElement[];
    aoiInformation: AoiInformation;
    activeConflictId?: number;
}
interface OwnProps {
    className?: string;
}

interface AoiInformation {
    name: string;
    description: string;
    bounds?: Bounds;
    area?: number;
    dateCloned?: string;
    localChangesetsCount?: number;
    nodesCount?: number;
    waysCount?: number;
    relationsCount?: number;
    totalResolvedElements?: number;
    totalConflictingElements?: number;
}

interface Params {
    setConflicts?: (conflicts: BasicConflictElement[]) => void;
    setAoiInformation?: (aoiInformation: AoiInformation) => void;
}

interface Response {
    aoi: AoiInformation;
}

const defaultAoi = {
    name: '-',
    description: '-',
};

const conflictKeySelector = (d: BasicConflictElement) => d.id.toString();

const requestOptions: { [key: string]: ClientAttributes<OwnProps, Params> } = {
    currentAoiGet: {
        url: '/replay-tool/',
        method: methods.GET,
        onMount: true,
        onSuccess: ({
            params,
            response,
        }) => {
            if (!params || !params.setAoiInformation) {
                return;
            }
            const { aoi = defaultAoi } = response as Response;
            const {
                name,
                description,
            } = aoi;

            const { setAoiInformation } = params;

            setAoiInformation({
                name,
                description,
            });
        },
    },
    conflictsGet: {
        url: '/conflicts/',
        method: methods.GET,
        onMount: true,
        onSuccess: ({
            params,
            response,
        }) => {
            if (!params || !params.setConflicts) {
                return;
            }
            const { results } = response as {
                results: BasicConflictElement[];
            };
            if (!results) {
                params.setConflicts([]);
            }
            params.setConflicts(results);
        },
    },
};

type Props = NewProps<OwnProps, Params>;

class ConflictResolution extends React.PureComponent<Props, State> {
    public constructor(props: Props) {
        super(props);

        const {
            requests: {
                conflictsGet,
                currentAoiGet,
            },
        } = this.props;
        conflictsGet.setDefaultParams({ setConflicts: this.setConflicts });
        currentAoiGet.setDefaultParams({ setAoiInformation: this.setAoiInformation });

        this.state = {
            conflicts: [],
            activeConflictId: undefined,
            aoiInformation: defaultAoi,
        };
    }

    private getConflictListItemRendererParams = (_: string, conflict: BasicConflictElement) => ({
        conflictId: conflict.id,
        name: conflict.name,
        onClick: this.handleConflictListItemClick,
        isActive: this.state.activeConflictId === conflict.id,
        type: conflict.type,
        status: conflict.status,
    });

    private setAoiInformation = (aoiInformation: AoiInformation) => {
        this.setState({ aoiInformation });
    }

    private setConflicts = (conflicts: BasicConflictElement[]) => {
        const { activeConflictId } = this.state;
        if (!activeConflictId && conflicts.length > 0) {
            const newActiveConflictId = conflicts[0].id;
            this.setState({ conflicts, activeConflictId: newActiveConflictId });
        } else {
            this.setState({ conflicts });
        }
    }

    private handleConflictListItemClick = (conflictId: number) => {
        this.setState({ activeConflictId: conflictId });
    }

    private handleConflictStatusUpdate = (
        conflictId: number,
        resolutionStatus: ResolutionStatus,
    ) => {
        const { conflicts } = this.state;
        const newConflicts = produce(conflicts, (safeConflicts) => {
            const activeConflictIndex = safeConflicts.findIndex(
                (c: BasicConflictElement) => c.id === conflictId,
            );
            // eslint-disable-next-line no-param-reassign
            safeConflicts[activeConflictIndex].status = resolutionStatus;
        });
        this.setState({ conflicts: newConflicts });
    }

    public render() {
        const {
            className,
            requests: {
                currentAoiGet: { pending: currentAoiPending },
                conflictsGet: { pending: conflictsGetPending },
            },
        } = this.props;

        const {
            activeConflictId,
            aoiInformation,
            conflicts,
        } = this.state;

        const total = conflicts.length;
        const resolved = conflicts.filter(c => c.status === 'resolved').length;
        const partiallyResolved = conflicts.filter(c => c.status === 'partially_resolved').length;
        const pending = currentAoiPending || conflictsGetPending;

        return (
            <div className={_cs(className, styles.conflictResolution)}>
                {pending && <LoadingAnimation /> }
                <div className={styles.sidebar}>
                    <header className={styles.header}>
                        <h2 className={styles.heading}>
                            { aoiInformation.name}
                        </h2>
                        <div className={styles.details}>
                            <ProgressBar
                                className={styles.progressBar}
                                progress={100 * (resolved / total)}
                            />
                            <ConflictStatus
                                className={styles.conflictStatus}
                                total={total}
                                partiallyResolved={partiallyResolved}
                                resolved={resolved}
                            />
                        </div>
                    </header>
                    <h3 className={styles.conflictHeader}>
                        Conflicts
                    </h3>
                    <ListView
                        className={styles.conflictList}
                        data={conflicts}
                        renderer={ConflictListItem}
                        rendererParams={this.getConflictListItemRendererParams}
                        keySelector={conflictKeySelector}
                    />
                </div>
                <Conflict
                    key={activeConflictId}
                    activeConflictId={activeConflictId}
                    className={styles.content}
                    updateConflictStatus={this.handleConflictStatusUpdate}
                />
            </div>
        );
    }
}

export default createConnectedRequestCoordinator<OwnProps>()(
    createRequestClient(requestOptions)(ConflictResolution),
);
