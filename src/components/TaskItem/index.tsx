import React from 'react';
import { _cs } from '@togglecorp/fujs';

import Spinner from '#rsu/../v2/View/Spinner';
import Icon from '#rscg/Icon';

import styles from './styles.scss';

type Status = 'not-initiated' | 'pending' | 'completed' | 'failed';
interface Props {
    className?: string;
    status: Status;
    label: string;
}

const iconNames: {
    [key in Status]: string;
} = {
    'not-initiated': 'checkmarkCircleEmpty',
    completed: 'checkmarkCircle',
    failed: 'error',
    pending: 'checkmarkCircleEmpty',
};

class TaskItem extends React.PureComponent<Props> {
    public render() {
        const {
            className,
            status,
            label,
        } = this.props;

        return (
            <div className={_cs(styles.taskItem, className)}>
                <div className={styles.left}>
                    { status === 'pending' ? (
                        <Spinner className={styles.spinner} />
                    ) : (
                        <Icon name={iconNames[status]} />
                    )}
                </div>
                <div className={styles.right}>
                    { label }
                </div>
            </div>
        );
    }
}

export default TaskItem;
