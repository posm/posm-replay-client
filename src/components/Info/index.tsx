import React from 'react';
import { _cs } from '@togglecorp/fujs';

import Icon from '#rscg/Icon';

import styles from './styles.scss';

interface Props {
    className?: string;
    message?: string;
}

class Info extends React.PureComponent<Props> {
    public render() {
        const {
            className,
            message,
        } = this.props;

        return (
            <div className={_cs(styles.info, className)}>
                <Icon
                    className={styles.icon}
                    name="infoCircle"
                />
                <div className={styles.message}>
                    { message }
                </div>
            </div>
        );
    }
}

export default Info;
