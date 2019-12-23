import React, { useCallback } from 'react';
import {
    TagStatus,
    ResolveOrigin,
} from '../types';

import Row from '../Row';
import Tag from '../Tag';

import styles from './styles.scss';


interface TagRowProps extends TagStatus {
    oursSelected: boolean;
    theirsSelected: boolean;
    selected: boolean;
    onClick: (title: string, origin: ResolveOrigin, value?: string,) => void;
}

const TagRow = (props: TagRowProps) => {
    const {
        title,

        originalValue,
        oursValue,
        theirsValue,

        oursDefined,
        theirsDefined,

        oursChanged,
        theirsChanged,

        oursSelected,
        theirsSelected,

        selected,
        conflicted,

        onClick,
    } = props;


    const handleTheirsClick = useCallback(
        () => {
            onClick(title, 'theirs', theirsValue);
        },
        [onClick, title, theirsValue],
    );

    const handleOursClick = useCallback(
        () => {
            onClick(title, 'ours', oursValue);
        },
        [onClick, title, oursValue],
    );

    return (
        <Row
            key={title}
            leftClassName={styles.tagContainer}
            left={(
                <Tag
                    title={title}
                    value={originalValue}
                    disabled
                />
            )}
            centerClassName={styles.tagContainer}
            center={
                oursDefined && (
                    <Tag
                        title={title}
                        value={oursValue}
                        changed={oursChanged}
                        conflicted={!selected && conflicted}
                        selected={oursSelected}
                        disabled={!conflicted}
                        onClick={handleOursClick}
                    />
                )
            }
            rightClassName={styles.tagContainer}
            right={
                theirsDefined && (
                    <Tag
                        title={title}
                        value={theirsValue}
                        changed={theirsChanged}
                        conflicted={!selected && conflicted}
                        selected={theirsSelected}
                        disabled={!conflicted}
                        onClick={handleTheirsClick}
                    />
                )
            }
        />
    );
};

export default TagRow;
