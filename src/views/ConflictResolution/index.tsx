import React from 'react';
import {
    _cs,
    intersection,
    union,
    difference,
} from '@togglecorp/fujs';

import ListView from '#rsu/../v2/View/ListView';
import Message from '#rsu/../v2/View/Message';

import ProgressBar from '#components/ProgressBar';
import ConflictStatus from '#components/ConflictStatus';
import { ConflictElement, Tags } from '#constants/types';

import ConflictDetail from './ConflictDetail';
import ConflictListItem from './ConflictListItem';
import { conflictList } from './dummy';

import styles from './styles.scss';

function identifyChanges(prev: Tags | undefined, next: Tags | undefined) {
    if (!prev || !next) {
        return {
            all: [],
            altered: new Set<string>(),
        };
    }

    const prevKeys = new Set(Object.keys(prev));
    const nextKeys = new Set(Object.keys(next));

    const all = union(prevKeys, nextKeys);
    const deleted = difference(prevKeys, nextKeys);
    const added = difference(nextKeys, prevKeys);

    const common = intersection(prevKeys, nextKeys);
    const modified = new Set([...common].filter(key => prev[key] !== next[key]));

    // altered: added, deleted or value modified
    const altered = union(modified, union(deleted, added));

    return {
        all: [...all],
        altered,
    };
}

function getIterableTags(state: Tags, all: string[], altered: Set<string>) {
    const mapping = all.map((key) => {
        const item = state[key];
        const isAltered = altered.has(key);
        return { key, value: item, isAltered };
    });
    return mapping;
}

// const { all, altered } = identifyChanges(TagForCollege, TagForCollege2);
// const iterTagsOne = getIterableTags(TagForCollege, all, altered);
// console.warn(iterTagsOne);
// const iterTagsTwo = getIterableTags(TagForCollege2, all, altered);
// console.warn(iterTagsTwo);

interface State {
    activeConflictId?: string;
}
interface Params {
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

    private handleConflictListItemClick = (conflictId: string) => {
        this.setState({ activeConflictId: conflictId });
    }

    // TODO: memoize
    private getActiveConflict = (cl: ConflictElement[], activeConflictId: string | undefined) => {
        const activeConflict = cl.find(c => c.id === activeConflictId);

        return activeConflict;
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
                {activeConflict ? (
                    <div className={styles.content}>
                        <h1 className={styles.title}>
                            { activeConflict.title }
                        </h1>
                        <div className={styles.mainContent}>
                            <ConflictDetail
                                className={styles.conflictDetail}
                                data={activeConflict.original}
                                type={activeConflict.type}
                                title="Original"
                            />
                            <ConflictDetail
                                className={styles.conflictDetail}
                                data={activeConflict.ours}
                                type={activeConflict.type}
                                title="Ours"
                            />
                            <ConflictDetail
                                className={styles.conflictDetail}
                                data={activeConflict.theirs}
                                type={activeConflict.type}
                                title="Theirs"
                            />
                        </div>
                    </div>
                ) : (
                    <Message>
                        Please select a conflict to continue.
                    </Message>
                )}
            </div>
        );
    }
}

export default ConflictResolution;
