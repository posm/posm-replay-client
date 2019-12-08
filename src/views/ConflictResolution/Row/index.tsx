import React from 'react';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.scss';

interface Props {
    className?: string;
    leftClassName?: string;
    centerClassName?: string;
    rightClassName?: string;

    left?: React.ReactNode;
    center?: React.ReactNode;
    right?: React.ReactNode;
}

const Row = (props: Props) => {
    const {
        left,
        center,
        right,

        className,
        leftClassName,
        centerClassName,
        rightClassName,
    } = props;

    return (
        <div
            className={_cs(styles.rowContainer, className)}
        >
            <div className={_cs(styles.rowItem, leftClassName)}>
                {left}
            </div>
            <div className={_cs(styles.rowItem, centerClassName)}>
                {center}
            </div>
            <div className={_cs(styles.rowItem, rightClassName)}>
                {right}
            </div>
        </div>
    );
};

export default Row;
