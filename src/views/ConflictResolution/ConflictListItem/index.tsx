import React from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    RiCheckboxBlankCircleLine,
    RiCheckboxCircleLine,
    RiCloseCircleLine,
} from 'react-icons/ri';

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
    [key in ResolutionStatus]: any;
} = {
    unresolved: RiCloseCircleLine,
    resolved: RiCheckboxCircleLine,
    // eslint-disable-next-line @typescript-eslint/camelcase
    partially_resolved: RiCheckboxBlankCircleLine,
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

        const MyIcon = iconNames[status];

        return (
            <button
                className={_cs(className, styles.conflictListItem, isActive && styles.active)}
                onClick={this.handleClick}
                type="button"
            >
                {MyIcon && <MyIcon className={_cs(styles.icon, iconClassNames[status])} />}
                <span className={styles.title}>
                    {`${name} (${type})`}
                </span>
            </button>
        );
    }
}

export default ConflictListItem;
