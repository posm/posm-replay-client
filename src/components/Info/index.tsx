import React from 'react';
import { _cs } from '@togglecorp/fujs';
import { RiInformationLine } from 'react-icons/ri';

import styles from './styles.scss';

interface Props {
    className?: string;
    title?: React.ReactNode;
    message?: React.ReactNode;
    variant?: 'danger' | 'info' | 'success';
}

class Info extends React.PureComponent<Props> {
    public render() {
        const {
            className,
            title,
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
                    variant === 'success' && styles.success,
                )}
            >
                <div className={styles.title}>
                    <RiInformationLine
                        className={_cs(
                            styles.icon,
                            variant === 'info' && styles.info,
                            variant === 'danger' && styles.danger,
                            variant === 'success' && styles.success,
                        )}
                    />
                    <div className={styles.text}>
                        {title}
                    </div>
                </div>
                {message && (
                    <div className={styles.message}>
                        {message}
                    </div>
                )}
            </div>
        );
    }
}

export default Info;
