import React from 'react';
import { _cs } from '@togglecorp/fujs';

import ListView from '#rsu/../v2/View/ListView';

import ProgressBar from '#components/ProgressBar';
import ConflictStatus from '#components/ConflictStatus';
import { ConflictElement } from '#constants/types';

import ConflictDetail from './ConflictDetail';
import ConflictListItem from './ConflictListItem';

import styles from './styles.scss';

interface State {
    activeConflictId: string;
}
interface Params {
    // triggerAlertRequest: (timeout: number) => void;
}
interface OwnProps {
    className?: string;
}
type Props = OwnProps;

const conflictList: ConflictElement[] = [
    { id: '6', title: 'School at Sundarijal', resolutionStatus: 'resolved', type: 'node' },
    { id: '2', title: 'Bridge near Kupondole', resolutionStatus: 'resolved', type: 'node' },
    { id: '3', title: 'Hospital in Bhaisepati', resolutionStatus: 'partially-resolved', type: 'node' },
    { id: '4', title: 'House in Jwagal', resolutionStatus: 'conflicted', type: 'node' },
    { id: '5', title: 'Road near Chakupat', resolutionStatus: 'conflicted', type: 'way' },
    { id: '1', title: 'Building in Jawalakhel', resolutionStatus: 'conflicted', type: 'node' },
];

const conflictKeySelector = (d: ConflictElement) => d.id;

// TODO: show type

// eslint-disable-next-line react/prefer-stateless-function
class ConflictResolution extends React.PureComponent<Props, State> {
    public constructor(props: Props) {
        super(props);

        this.state = {
            activeConflictId: '6',
        };
    }

    private getConflictListItemRendererParams = (_: string, conflict: ConflictElement) => ({
        conflictId: conflict.id,
        title: conflict.title,
        onClick: this.handleConflictListItemClick,
        isActive: this.state.activeConflictId === conflict.id,
        resolutionStatus: conflict.resolutionStatus,
    });

    private handleConflictListItemClick = (conflictId: string) => {
        this.setState({ activeConflictId: conflictId });
    }

    // TODO: memoize
    private getActiveConflict = (cl: ConflictElement[], activeConflictId: string) => {
        const activeConflict = cl.find(c => c.id === activeConflictId);

        return activeConflict;
    }

    public render() {
        const { className } = this.props;
        const { activeConflictId } = this.state;

        const data = {
            locationName: 'Lalitpur',
        };

        const total = conflictList.length;
        const resolved = conflictList.filter(c => c.resolutionStatus === 'resolved').length;
        const partiallyResolved = conflictList.filter(c => c.resolutionStatus === 'partially-resolved').length;

        return (
            <div className={_cs(className, styles.conflictResolution)}>
                <div className={styles.sidebar}>
                    <header className={styles.header}>
                        <h2 className={styles.heading}>
                            { data.locationName }
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
                    <ListView
                        className={styles.conflictList}
                        data={conflictList}
                        renderer={ConflictListItem}
                        rendererParams={this.getConflictListItemRendererParams}
                        keySelector={conflictKeySelector}
                    />
                </div>
                <ConflictDetail
                    data={this.getActiveConflict(conflictList, activeConflictId)}
                    className={styles.conflictDetail}
                />
            </div>
        );
    }
}

export default ConflictResolution;
