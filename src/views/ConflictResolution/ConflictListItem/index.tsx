import React from 'react';
import { _cs } from '@togglecorp/fujs';

import Icon from '#rscg/Icon';

import { ResolutionStatus } from '#constants/types';

import styles from './styles.scss';

interface Props {
    className?: string;
    title: string;
    conflictId: string;
    onClick: (conflictId: string) => void;
    isActive: boolean;
    resolutionStatus: ResolutionStatus;
}

const iconNames: {
    [key in ResolutionStatus]: string;
} = {
    conflicted: 'error',
    resolved: 'checkmarkCircle',
    'partially-resolved': 'checkmarkCircleEmpty',
};
const iconClassNames: {
    [key in ResolutionStatus]: string;
} = {
    conflicted: styles.error,
    resolved: styles.success,
    'partially-resolved': styles.pending,
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
            title,
            isActive,
            resolutionStatus,
        } = this.props;

        return (
            <button
                className={_cs(className, styles.conflictListItem, isActive && styles.active)}
                onClick={this.handleClick}
                type="button"
            >
                <Icon
                    className={_cs(styles.icon, iconClassNames[resolutionStatus])}
                    name={iconNames[resolutionStatus]}
                />
                { title }
            </button>
        );
    }
}

export default ConflictListItem;
