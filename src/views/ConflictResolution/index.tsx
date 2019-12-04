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
    { id: '1', title: 'Building in Jawalakhel' },
    { id: '2', title: 'Bridge near Kupondole' },
    { id: '3', title: 'Hospital in Bhaisepati' },
];

const conflictKeySelector = (d: ConflictElement) => d.id;

// eslint-disable-next-line react/prefer-stateless-function
class ConflictResolution extends React.PureComponent<Props, State> {
    public constructor(props: Props) {
        super(props);

        this.state = {
            activeConflictId: '1',
        };
    }

    private getConflictListItemRendererParams = (_: string, conflict: ConflictElement) => ({
        conflictId: conflict.id,
        title: conflict.title,
        onClick: this.handleConflictListItemClick,
        isActive: this.state.activeConflictId === conflict.id,
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
                                progress={30}
                            />
                            <ConflictStatus
                                className={styles.conflictStatus}
                                total={10}
                                resolved={3}
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
/*
export default connect(mapStateToProps, mapDispatchToProps)(
    createConnectedRequestCoordinator<ReduxProps>()(
        createRequestClient(requests)(
            ConflictResolution,
        ),
    ),
);
*/
