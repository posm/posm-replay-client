import React from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    RiCheckboxBlankCircleLine,
    RiCheckboxCircleLine,
    RiCloseCircleLine,
    RiIndeterminateCircleLine,
} from 'react-icons/ri';

import Spinner from '#rsu/../v2/View/Spinner';

import styles from './styles.scss';

export type Status = 'not-initiated' | 'pending' | 'completed' | 'failed';

interface Props {
    className?: string;
    status: Status;
    label: string;
}

const iconNames: {
    [key in Status]: any;
} = {
    'not-initiated': RiCheckboxBlankCircleLine,
    completed: RiCheckboxCircleLine,
    failed: RiCloseCircleLine,
    pending: RiIndeterminateCircleLine,
};

const statusStyles: {
    [key in Status]: string;
} = {
    'not-initiated': styles.notInitiated,
    completed: styles.completed,
    failed: styles.failed,
    pending: styles.pending,
};

class TaskItem extends React.PureComponent<Props> {
    public render() {
        const {
            className,
            status,
            label,
        } = this.props;

        const MyIcon = iconNames[status];

        return (
            <div className={_cs(styles.taskItem, className, statusStyles[status])}>
                <div className={styles.left}>
                    {status === 'pending' ? (
                        <Spinner className={styles.spinner} />
                    ) : (
                        MyIcon && <MyIcon />
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
