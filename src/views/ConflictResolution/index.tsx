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

import ConflictMap from './ConflictDetail';
import ConflictListItem from './ConflictListItem';
import { conflictList } from './dummy';

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

interface State {
    activeConflictId?: string;
    showOnlyConflicts: boolean;
}
interface OwnProps {
    className?: string;
}
type Props = OwnProps;

const conflictKeySelector = (d: ConflictElement) => d.id;

// eslint-disable-next-line react/prefer-stateless-function
class ConflictResolution extends React.PureComponent<Props, State> {
    public constructor(props: Props) {
        super(props);

        this.state = {
            // activeConflictId: '6',
            showOnlyConflicts: true,
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

    // TODO: memoize
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

    private handleCheckboxChange = (value: boolean) => {
        this.setState({ showOnlyConflicts: value });
    }

    public render() {
        const { className } = this.props;
        const { activeConflictId } = this.state;

        const data = {
            locationName: 'Lalitpur',
        };

        const total = conflictList.length;
        const resolved = conflictList.filter(c => c.resolutionStatus === 'resolved').length;
        const partiallyResolved = conflictList.filter(c => c.resolutionStatus === 'partially-resolved').length;

        const activeConflict = this.getActiveConflict(conflictList, activeConflictId);
        let children = null;
        if (activeConflict) {
            const { showOnlyConflicts } = this.state;

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
                            {`${conflictedTags.length} conflicts`}
                        </div>
                    )}
                    <div className={styles.subHeaderContainer}>
                        <h2 className={styles.subHeader}> Original </h2>
                        <h2 className={styles.subHeader}> Ours </h2>
                        <h2 className={styles.subHeader}> Theirs </h2>
                    </div>
                    <div className={styles.mapContainer}>
                        <div className={styles.map}>
                            <ConflictMap
                                className={styles.remap}
                                type={type}
                                bounds={original.bounds}
                                geoJSON={original.geoJSON}
                            />
                        </div>
                        <div className={styles.map}>
                            {ours ? (
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
                            )}
                        </div>
                        <div className={styles.map}>
                            {theirs ? (
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
                            )}
                        </div>
                    </div>
                    <div className={styles.subHeaderContainer}>
                        <h3 className={styles.subHeader}>
                            {`Tags (${originalTagCount})`}
                        </h3>
                        <h3 className={styles.subHeader}>
                            { ours ? `Tags (${oursTagCount})` : ''}
                        </h3>
                        <h3 className={styles.subHeader}>
                            {theirs ? `Tags (${theirsTagCount})` : ''}
                        </h3>
                    </div>
                    {
                        (modifiedMode && showOnlyConflicts ? conflictedTags : tags).map(({
                            title,

                            originalValue,
                            oursValue,
                            theirsValue,

                            oursChanged,
                            theirsChanged,
                            conflicted,
                        }) => (
                            <div
                                className={styles.tagContainer}
                                key={title}
                            >
                                <div className={styles.tag}>
                                    {originalValue && (
                                        <div className={styles.input}>
                                            <div className={styles.title}>
                                                {title}
                                            </div>
                                            <div className={styles.value}>
                                                {originalValue}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className={styles.tag}>
                                    {ours && (
                                        <div
                                            className={
                                                _cs(
                                                    styles.input,
                                                    oursChanged && styles.changed,
                                                    conflicted && styles.conflicted,
                                                )
                                            }
                                        >
                                            <div className={styles.title}>
                                                {title}
                                            </div>
                                            <div className={styles.value}>
                                                {oursValue}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className={styles.tag}>
                                    {theirs && (
                                        <div
                                            className={
                                                _cs(
                                                    styles.input,
                                                    theirsChanged && styles.changed,
                                                    conflicted && styles.conflicted,
                                                )
                                            }
                                        >
                                            <div className={styles.title}>
                                                {title}
                                            </div>
                                            <div className={styles.value}>
                                                {theirsValue}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    }
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
                            { data.locationName }
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
