import React from 'react';
import { _cs } from '@togglecorp/fujs';

import ListView from '#rsu/../v2/View/ListView';
import ProgressBar from '#components/ProgressBar';
import ConflictStatus from '#components/ConflictStatus';
import { ConflictElement, Bounds } from '#constants/types';

import {
    createConnectedRequestCoordinator,
    createRequestClient,
    methods,
    NewProps,
    ClientAttributes,
} from '#request';

import ConflictListItem from './ConflictListItem';
import Conflict from './Conflict';
import { conflictList } from './dummy';

import styles from './styles.scss';

interface State {
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
    setConflicts?: (conflicts: ConflictElement[]) => void;
    setAoiInformation?: (aoiInformation: AoiInformation) => void;
}

const defaultAoi = {
    name: '-',
    description: '-',
};

const conflictKeySelector = (d: ConflictElement) => d.id;

const requestOptions: { [key: string]: ClientAttributes<OwnProps, Params> } = {
    currentAoiGet: {
        url: '/replay-tool/',
        method: methods.GET,
        onMount: true,
        onSuccess: ({
            params,
            response: {
                aoi = defaultAoi,
            },
        }) => {
            if (!params || !params.setAoiInformation) {
                return;
            }
            const {
                name,
                description,
            } = aoi as AoiInformation;

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
            params: { setConflicts },
            response: { results },
        }) => {
            if (!results) {
                setConflicts([]);
            }
            setConflicts(results);
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
            aoiInformation: {
                name: '-',
                description: '-',
            },
        };
    }

    private getConflictListItemRendererParams = (_: string, conflict: ConflictElement) => ({
        conflictId: conflict.id,
        name: conflict.name,
        onClick: this.handleConflictListItemClick,
        isActive: this.state.activeConflictId === conflict.id,
        type: conflict.type,
        resolutionStatus: conflict.resolutionStatus,
    });

    private setAoiInformation = (aoiInformation) => {
        this.setState({ aoiInformation });
    }

    private setConflicts = (conflicts: ConflictElement[]) => {
        this.setState({ conflicts });
    }

    private handleConflictListItemClick = (conflictId: string) => {
        this.setState({ activeConflictId: conflictId });
    }


    public render() {
        const { className } = this.props;
        const {
            activeConflictId,
            aoiInformation,
            conflicts,
        } = this.state;

        const total = conflictList.length;
        const resolved = conflictList.filter(c => c.resolutionStatus === 'resolved').length;
        const partiallyResolved = conflictList.filter(c => c.resolutionStatus === 'partially-resolved').length;

        return (
            <div className={_cs(className, styles.conflictResolution)}>
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
                />
            </div>
        );
    }
}

export default createConnectedRequestCoordinator<OwnProps>()(
    createRequestClient(requestOptions)(ConflictResolution),
);
