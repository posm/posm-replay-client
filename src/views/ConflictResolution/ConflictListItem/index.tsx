import React from 'react';
import { _cs } from '@togglecorp/fujs';

import Icon from '#rscg/Icon';

import { ResolutionStatus, ElementType } from '#constants/types';

import styles from './styles.scss';

interface Props {
    className?: string;
    name: string;
    conflictId: number;
    onClick: (conflictId: number) => void;
    isActive: boolean;
    status: ResolutionStatus;
    type: ElementType;
}

const iconNames: {
    [key in ResolutionStatus]: string;
} = {
    unresolved: 'error',
    resolved: 'checkmarkCircle',
    partially_resolved: 'checkmarkCircleEmpty', // eslint-disable-line @typescript-eslint/camelcase
};
const iconClassNames: {
    [key in ResolutionStatus]: string;
} = {
    unresolved: styles.error,
    resolved: styles.success,
    partially_resolved: styles.pending, // eslint-disable-line @typescript-eslint/camelcase
};

class ConflictListItem extends React.PureComponent<Props> {
    private handleClick = () => {
        const {
            conflictId,
            onClick,
        } = this.props;

        onClick(conflictId);
    }

    public render() {
        const {
            className,
            name,
            isActive,
            status,
            type,
        } = this.props;

        return (
            <button
                className={_cs(className, styles.conflictListItem, isActive && styles.active)}
                onClick={this.handleClick}
                type="button"
            >
                <Icon
                    className={_cs(styles.icon, iconClassNames[status])}
                    name={iconNames[status]}
                />
                {`${name} (${type})`}
            </button>
        );
    }
}

export default ConflictListItem;
