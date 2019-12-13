import React from 'react';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.scss';

interface Props {
    title: string;
    value?: string;
    onClick?: () => void;

    changed: boolean;
    conflicted: boolean;
    disabled: boolean;
    selected: boolean;
}

const Tag = (props: Props) => {
    const {
        title,
        value,
        conflicted,
        changed,
        selected,
        onClick,
        disabled,
    } = props;

    return (
        <button
            className={
                _cs(
                    styles.input,
                    changed && styles.changed,
                    conflicted && styles.conflicted,
                    selected && styles.selected,
                    !disabled && styles.clickable,
                )
            }
            onClick={onClick}
            type="button"
            disabled={disabled}
        >
            <div className={styles.title}>
                {title}
            </div>
            <div className={styles.value}>
                {value}
            </div>
        </button>
    );
};
Tag.defaultProps = {
    conflicted: false,
    changed: false,
    selected: false,
    disabled: false,
};

export default Tag;
