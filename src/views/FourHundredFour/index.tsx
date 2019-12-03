import React from 'react';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.scss';

const FourHundredFour = ({
    className,
}: {
    className?: string;
}) => (
    <div className={_cs(className, styles.fourHundredFour)}>
        <h1 className={styles.heading}>
            404
        </h1>
        <p className={styles.message}>
            The page you are looking for does not exist!
        </p>
    </div>
);

export default FourHundredFour;
