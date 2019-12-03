import React from 'react';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.scss';

const FourHundredThree = ({
    className,
}: {
    className?: string;
}) => (
    <div className={_cs(className, styles.fourHundredThree)}>
        <h1 className={styles.heading}>
            403
        </h1>
        <p className={styles.message}>
            You do not have enough permissions to view this page.
        </p>
    </div>
);

export default FourHundredThree;
