import React from 'react';
import { _cs } from '@togglecorp/fujs';

import { ConflictElement } from '#constants/types';

import styles from './styles.scss';

interface Props {
    className?: string;
    data?: ConflictElement;
}

interface State {
}

class ConflictDetail extends React.PureComponent<Props, State> {
    public render() {
        const {
            className,
            data,
        } = this.props;

        if (!data) {
            return null;
        }

        return (
            <div className={_cs(className, styles.conflictDetail)}>
                { data.title }
            </div>
        );
    }
}

export default ConflictDetail;
