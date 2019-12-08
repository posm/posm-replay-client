import React from 'react';
import {
    _cs,
    union,
    // intersection,
    // difference,
} from '@togglecorp/fujs';

import ListView from '#rsu/../v2/View/ListView';
import Message from '#rsu/../v2/View/Message';
import Button from '#rsu/../v2/Action/Button';
import Checkbox from '#rsu/../v2/Input/Checkbox';

import ProgressBar from '#components/ProgressBar';
import ConflictStatus from '#components/ConflictStatus';
import { ConflictElement, Tags } from '#constants/types';

import Row from './Row';
import Tag from './Tag';
import ConflictMap from './ConflictMap';
import ConflictListItem from './ConflictListItem';
import { conflictList, aoiInformation } from './dummy';

import styles from './styles.scss';

function getTagsComparision(original: Tags, prev: Tags | undefined, next: Tags | undefined) {
    const originalKeys = new Set(Object.keys(original));
    const prevKeys = new Set(prev ? Object.keys(prev) : []);
    const nextKeys = new Set(next ? Object.keys(next) : []);

    const allKeys = union(originalKeys, union(prevKeys, nextKeys));

    return [...allKeys].sort().map((key) => {
        const originalValue = original[key];
        const oursValue = prev ? prev[key] : undefined;
        const theirsValue = next ? next[key] : undefined;

        const oursChanged = originalValue !== oursValue;
        const theirsChanged = originalValue !== theirsValue;

        const conflicted = (prev && next) && oursValue !== theirsValue;

        return {
            title: key,
            originalValue,

            oursValue,
            oursChanged,

            theirsValue,
            theirsChanged,

            conflicted,
        };
    });
}

type ResolveOrigin = 'theirs' | 'ours';

interface Resolution {
    [key: string]: ResolveOrigin | undefined;
}

interface State {
    activeConflictId?: string;
    showOnlyConflicts: boolean;
    resolution: Resolution;
}
interface OwnProps {
    className?: string;
}
type Props = OwnProps;

const conflictKeySelector = (d: ConflictElement) => d.id;

class ConflictResolution extends React.PureComponent<Props, State> {
    public constructor(props: Props) {
        super(props);

        this.state = {
            activeConflictId: undefined,
            showOnlyConflicts: true,
            resolution: {},
        };
    }

    private getConflictListItemRendererParams = (_: string, conflict: ConflictElement) => ({
        conflictId: conflict.id,
        title: conflict.title,
        onClick: this.handleConflictListItemClick,
        isActive: this.state.activeConflictId === conflict.id,
        type: conflict.type,
        resolutionStatus: conflict.resolutionStatus,
    });

    private getActiveConflict = (cl: ConflictElement[], activeConflictId: string | undefined) => {
        const activeConflict = cl.find(c => c.id === activeConflictId);

        return activeConflict;
    }

    private handleConflictListItemClick = (conflictId: string) => {
        this.setState({ activeConflictId: conflictId });
    }

    private handleSave = () => {
        console.warn('save');
    }

    private handleTagClick = (key: string, origin: ResolveOrigin | undefined) => {
        this.setState((state) => {
            const { resolution } = state;
            const newResolution = {
                ...resolution,
                [key]: origin === resolution[key] ? undefined : origin,
            };
            return { ...state, resolution: newResolution };
        });
    }

    private handleCheckboxChange = (value: boolean) => {
        this.setState({ showOnlyConflicts: value });
    }

    public render() {
        const { className } = this.props;
        const { activeConflictId } = this.state;

        const total = conflictList.length;
        const resolved = conflictList.filter(c => c.resolutionStatus === 'resolved').length;
        const partiallyResolved = conflictList.filter(c => c.resolutionStatus === 'partially-resolved').length;

        const activeConflict = this.getActiveConflict(conflictList, activeConflictId);
        let children = null;
        if (activeConflict) {
            const {
                showOnlyConflicts,
                resolution,
            } = this.state;

            const {
                type,
                original,
                ours,
                theirs,
            } = activeConflict;

            const originalTagCount = Object.keys(original.tags).length;
            const oursTagCount = Object.keys(ours?.tags || {}).length;
            const theirsTagCount = Object.keys(theirs?.tags || {}).length;

            const tags = getTagsComparision(
                original.tags,
                ours?.tags,
                theirs?.tags,
            );

            const conflictedTags = tags.filter(tag => tag.conflicted);

            const resolvedTags = conflictedTags.filter(item => resolution[item.title]);

            const modifiedMode = !!ours && !!theirs;

            children = (
                <div className={styles.content}>
                    <div className={styles.headerContainer}>
                        <h1 className={styles.title}>
                            { activeConflict.title }
                        </h1>
                        <div className={styles.actions}>
                            {modifiedMode ? (
                                <>
                                    <Checkbox
                                        onChange={this.handleCheckboxChange}
                                        value={showOnlyConflicts}
                                        label="Show only conflicts"
                                    />
                                    <Button
                                        className={styles.button}
                                        onClick={this.handleSave}
                                        buttonType="button-primary"
                                    >
                                        Resolve
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        className={styles.button}
                                        onClick={this.handleSave}
                                        buttonType="button-primary"
                                    >
                                        Delete
                                    </Button>
                                    <Button
                                        className={styles.button}
                                        onClick={this.handleSave}
                                        buttonType="button-primary"
                                    >
                                        Keep
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                    {modifiedMode && (
                        <div className={styles.infoContainer}>
                            <ProgressBar
                                className={styles.progressBar}
                                progress={100 * (resolvedTags.length / conflictedTags.length)}
                            />
                            <ConflictStatus
                                className={styles.conflictStatus}
                                total={conflictedTags.length}
                                resolved={resolvedTags.length}
                            />
                        </div>
                    )}
                    <div className={styles.titleRow}>
                        <Row
                            left={(
                                <h2>
                                    Original
                                </h2>
                            )}
                            center={(
                                <h2>
                                    Ours
                                </h2>
                            )}
                            right={(
                                <h2>
                                    Theirs
                                </h2>
                            )}
                        />
                    </div>
                    <div className={styles.rowList}>
                        <Row
                            left={(
                                <ConflictMap
                                    className={styles.remap}
                                    type={type}
                                    bounds={original.bounds}
                                    geoJSON={original.geoJSON}
                                />
                            )}
                            center={
                                ours ? (
                                    <ConflictMap
                                        className={styles.remap}
                                        type={type}
                                        bounds={ours.bounds}
                                        geoJSON={ours.geoJSON}
                                    />
                                ) : (
                                    <Message>
                                        The element was deleted!
                                    </Message>
                                )
                            }
                            right={
                                theirs ? (
                                    <ConflictMap
                                        className={styles.remap}
                                        type={type}
                                        bounds={theirs.bounds}
                                        geoJSON={theirs.geoJSON}
                                    />
                                ) : (
                                    <Message>
                                        The element was deleted!
                                    </Message>
                                )
                            }
                        />
                        <Row
                            left={(
                                <h3 className={styles.subHeader}>
                                    {`Tags (${originalTagCount})`}
                                </h3>
                            )}
                            center={(
                                <h3 className={styles.subHeader}>
                                    { ours ? `Tags (${oursTagCount})` : ''}
                                </h3>
                            )}
                            right={(
                                <h3 className={styles.subHeader}>
                                    {theirs ? `Tags (${theirsTagCount})` : ''}
                                </h3>
                            )}
                        />
                        {
                            (modifiedMode && showOnlyConflicts ? conflictedTags : tags)
                                .map((item) => {
                                    const oursSelected = resolution[item.title] === 'ours';
                                    const theirsSelected = resolution[item.title] === 'theirs';

                                    const selected = oursSelected || theirsSelected;

                                    return {
                                        ...item,
                                        oursSelected,
                                        theirsSelected,
                                        selected: oursSelected || theirsSelected,
                                    };
                                })
                                .map(({
                                    title,

                                    originalValue,
                                    oursValue,
                                    theirsValue,

                                    oursChanged,
                                    theirsChanged,

                                    oursSelected,
                                    theirsSelected,

                                    selected,
                                    conflicted,
                                }) => (
                                    <Row
                                        left={(
                                            <Tag
                                                title={title}
                                                value={originalValue}
                                                disabled
                                            />
                                        )}
                                        center={
                                            ours && (
                                                <Tag
                                                    title={title}
                                                    value={oursValue}
                                                    changed={oursChanged}
                                                    conflicted={!selected && conflicted}
                                                    selected={oursSelected}
                                                    disabled={!conflicted}
                                                    onClick={() => this.handleTagClick(title, 'ours')}
                                                />
                                            )
                                        }
                                        right={
                                            theirs && (
                                                <Tag
                                                    title={title}
                                                    value={theirsValue}
                                                    changed={theirsChanged}
                                                    conflicted={!selected && conflicted}
                                                    selected={theirsSelected}
                                                    disabled={!conflicted}
                                                    onClick={() => this.handleTagClick(title, 'theirs')}
                                                />
                                            )
                                        }
                                    />
                                ))
                        }
                    </div>
                </div>
            );
        } else {
            children = (
                <Message>
                    Please select a conflict to continue.
                </Message>
            );
        }

        return (
            <div className={_cs(className, styles.conflictResolution)}>
                <div className={styles.sidebar}>
                    <header className={styles.header}>
                        <h2 className={styles.heading}>
                            { aoiInformation.locationName }
                        </h2>
                        <div className={styles.details}>
                            <ProgressBar
                                className={styles.progressBar}
                                progress={100 * (resolved / total)}
                            />
                            <ConflictStatus
                                className={styles.conflictStatus}
                                total={total}
                                partiallyResolved={partiallyResolved}
                                resolved={resolved}
                            />
                        </div>
                    </header>
                    <h3 className={styles.conflictHeader}>
                        Conflicts
                    </h3>
                    <ListView
                        className={styles.conflictList}
                        data={conflictList}
                        renderer={ConflictListItem}
                        rendererParams={this.getConflictListItemRendererParams}
                        keySelector={conflictKeySelector}
                    />
                </div>
                {children}
            </div>
        );
    }
}

export default ConflictResolution;
