import React from 'react';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.scss';

interface Props {
    className?: string;
    resolved: number;
    total: number;
    partiallyResolved: number;
    label: string;
}

class ConflictStatus extends React.PureComponent<Props> {
    public static defaultProps = {
        resolved: 0,
        partiallyResolved: 0,
        total: 0,
        label: 'conflicts',
    };

    public render() {
        const {
            className,
            resolved,
            label,
            total,
        } = this.props;

        return (
            <div className={_cs(styles.conflictStatus, className)}>
                <div className={styles.resolvedConflicts}>
                    {resolved}
                </div>
                <div className={styles.separator}>
                    of
                </div>
                <div className={styles.totalConflicts}>
                    {total}
                </div>
                <div className={styles.postLabel}>
                    {`${label} resolved`}
                </div>
            </div>
        );
    }
}

export default ConflictStatus;
