import React from 'react';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.scss';

interface Props {
    className?: string;
    title: string;
    conflictId: string;
    onClick: (conflictId: string) => void;
    isActive: boolean;
}

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
        } = this.props;

        return (
            <button
                className={_cs(className, styles.conflictListItem, isActive && styles.active)}
                onClick={this.handleClick}
                type="button"
            >
                { title }
            </button>
        );
    }
}

export default ConflictListItem;
