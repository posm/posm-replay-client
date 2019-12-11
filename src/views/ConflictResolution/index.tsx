import React, { useCallback } from 'react';
import {
    _cs,
    union,
    // intersection,
    // difference,
} from '@togglecorp/fujs';

import List from '#rsu/../v2/View/List';
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

interface TagStatus {
    title: string;
    originalValue: string | undefined;

    oursDefined: boolean;
    theirsDefined: boolean;

    oursValue: string | undefined;
    oursChanged: boolean;

    theirsValue: string | undefined;
    theirsChanged: boolean;

    conflicted: boolean;
}

function getTagsComparision(
    original: Tags,
    prev: Tags | undefined,
    next: Tags | undefined,
): TagStatus[] {
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

        const conflicted = !!prev && !!next && oursValue !== theirsValue;

        return {
            title: key,
            originalValue,

            oursDefined: !!prev,
            theirsDefined: !!next,

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

interface TagRowProps extends TagStatus {
    oursSelected: boolean;
    theirsSelected: boolean;
    selected: boolean;
    onClick: (title: string, origin: ResolveOrigin) => void;
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
            onClick(title, 'theirs');
        },
        [onClick, title],
    );

    const handleOursClick = useCallback(
        () => {
            onClick(title, 'ours');
        },
        [onClick, title],
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

const rowKeySelector = (t: TagStatus) => t.title;

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

    private handleDelete = () => {
        console.warn('delete');
    }

    private handleKeep = () => {
        console.warn('keep');
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

    private handleMapClick = (origin: ResolveOrigin | undefined) => {
        this.handleTagClick('$map', origin);
    }

    private handleCheckboxChange = (value: boolean) => {
        this.setState({ showOnlyConflicts: value });
    }

    private rowRendererParams = (key: string, item: TagStatus) => {
        const { resolution } = this.state;

        const oursSelected = resolution[key] === 'ours';
        const theirsSelected = resolution[key] === 'theirs';
        const selected = oursSelected || theirsSelected;

        return {
            ...item,
            onClick: this.handleTagClick,
            oursSelected,
            theirsSelected,
            selected,
        };
    }

    public render() {
        const { className } = this.props;
        const { activeConflictId } = this.state;

        const activeConflict = this.getActiveConflict(conflictList, activeConflictId);
        let children = null;
        if (activeConflict) {
            const {
                type,
                original,
                ours,
                theirs,
            } = activeConflict;

            const {
                showOnlyConflicts,
                resolution,
            } = this.state;

            // General
            const tags = getTagsComparision(
                original.tags,
                ours?.tags,
                theirs?.tags,
            );
            const conflictedTags = tags.filter(tag => tag.conflicted);
            const resolvedTags = conflictedTags.filter(item => resolution[item.title]);
            const modifiedMode = !!ours && !!theirs;

            // For map row
            const oursMapSelected = resolution.$map === 'ours';
            const theirsMapSelected = resolution.$map === 'theirs';
            const mapConflicted = !!ours && !!theirs && ours.geoJSON !== theirs.geoJSON;
            const mapSelected = oursMapSelected || theirsMapSelected;

            // For Info row
            let resolvedCount = resolvedTags.length;
            let conflictedCount = conflictedTags.length;
            if (mapConflicted) {
                conflictedCount += 1;
            }
            if (mapConflicted && mapSelected) {
                resolvedCount += 1;
            }

            // For Tag row
            const originalTagCount = Object.keys(original.tags).length;
            const oursTagCount = Object.keys(ours?.tags || {}).length;
            const theirsTagCount = Object.keys(theirs?.tags || {}).length;

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
                                        label="Only show conflicted tags"
                                    />
                                    <Button
                                        onClick={this.handleSave}
                                        buttonType="button-primary"
                                    >
                                        Resolve
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        onClick={this.handleDelete}
                                        buttonType="button-primary"
                                    >
                                        Delete
                                    </Button>
                                    <Button
                                        onClick={this.handleKeep}
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
                                progress={100 * (resolvedCount / conflictedCount)}
                            />
                            <ConflictStatus
                                className={styles.conflictStatus}
                                total={conflictedCount}
                                resolved={resolvedCount}
                                label="tag conflicts"
                            />
                        </div>
                    )}
                    <div className={styles.titleRowContainer}>
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
                    <div className={styles.tagRowsContainer}>
                        <Row
                            leftClassName={styles.mapContainer}
                            left={(
                                <ConflictMap
                                    className={styles.remap}
                                    type={type}
                                    bounds={original.bounds}
                                    geoJSON={original.geoJSON}
                                    defaultSelectedStyle="Humanitarian"
                                    disabled
                                />
                            )}
                            centerClassName={styles.mapContainer}
                            center={
                                ours ? (
                                    <ConflictMap
                                        className={styles.remap}
                                        type={type}
                                        bounds={ours.bounds}
                                        geoJSON={ours.geoJSON}
                                        defaultSelectedStyle="Humanitarian"
                                        onClick={() => this.handleMapClick('ours')}
                                        conflicted={!mapSelected && mapConflicted}
                                        selected={oursMapSelected}
                                        disabled={!mapConflicted}
                                    />
                                ) : (
                                    <Message>
                                        The element was deleted!
                                    </Message>
                                )
                            }
                            rightClassName={styles.mapContainer}
                            right={
                                theirs ? (
                                    <ConflictMap
                                        className={styles.remap}
                                        type={type}
                                        bounds={theirs.bounds}
                                        geoJSON={theirs.geoJSON}
                                        defaultSelectedStyle="OSM"
                                        onClick={() => this.handleMapClick('theirs')}
                                        conflicted={!mapSelected && mapConflicted}
                                        selected={theirsMapSelected}
                                        disabled={!mapConflicted}
                                    />
                                ) : (
                                    <Message>
                                        The element was deleted!
                                    </Message>
                                )
                            }
                        />
                        <Row
                            className={styles.subHeaderRow}
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
                        <List
                            data={modifiedMode && showOnlyConflicts ? conflictedTags : tags}
                            keySelector={rowKeySelector}
                            renderer={TagRow}
                            rendererParams={this.rowRendererParams}
                        />
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

        const total = conflictList.length;
        const resolved = conflictList.filter(c => c.resolutionStatus === 'resolved').length;
        const partiallyResolved = conflictList.filter(c => c.resolutionStatus === 'partially-resolved').length;

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
