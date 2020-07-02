import React from 'react';
import { _cs } from '@togglecorp/fujs';

import Icon from '#rscg/Icon';

import styles from './styles.scss';

interface Props {
    className?: string;
    message?: React.ReactNode;
    variant?: 'danger' | 'info';
}

class Info extends React.PureComponent<Props> {
    public render() {
        const {
            className,
            message,
            variant = 'info',
        } = this.props;

        return (
            <div
                className={_cs(
                    className,
                    styles.container,
                    variant === 'info' && styles.info,
                    variant === 'danger' && styles.danger,
                )}
            >
                <Icon
                    className={_cs(
                        styles.icon,
                        variant === 'info' && styles.info,
                        variant === 'danger' && styles.danger,
                    )}
                    name="infoCircle"
                />
                <div className={styles.message}>
                    {message}
                </div>
            </div>
        );
    }
}

export default Info;
