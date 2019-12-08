import React from 'react';
import {
    _cs,
    union,
    // intersection,
    // difference,
} from '@togglecorp/fujs';

import ListView from '#rsu/../v2/View/ListView';
import Message from '#rsu/../v2/View/Message';

import ProgressBar from '#components/ProgressBar';
import ConflictStatus from '#components/ConflictStatus';
import { ConflictElement, Tags } from '#constants/types';

// import ConflictDetail from './ConflictDetail';
import ConflictListItem from './ConflictListItem';
import { conflictList } from './dummy';

import styles from './styles.scss';

function getTagsComparision(original: Tags, prev: Tags | undefined, next: Tags | undefined) {
    const originalKeys = new Set(Object.keys(original));
    const prevKeys = new Set(prev ? Object.keys(prev) : []);
    const nextKeys = new Set(next ? Object.keys(next) : []);

    const allKeys = union(originalKeys, union(prevKeys, nextKeys));

    return [...allKeys].map((key) => {
        const originalValue = original[key];
        const oursValue = prev ? prev[key] : undefined;
        const theirsValue = next ? next[key] : undefined;

        const oursChanged = originalValue !== oursValue;
        const theirsChanged = originalValue !== oursValue;
        const conflicted = oursValue !== theirsValue;
        return {
            title: key,
            original: originalValue,

            ours: oursValue,
            oursChanged,

            theirs: theirsValue,
            theirsChanged,

            conflicted,
        };
    });
}

interface State {
    activeConflictId?: string;
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
                        <div className={styles.subHeader}>
                            <div> Original </div>
                            <div> Ours </div>
                            <div> Theirs </div>
                        </div>
                        <div className={styles.map}>
                            <div> Map 1 </div>
                            <div> Map 2 </div>
                            <div> Map 3 </div>
                        </div>
                        {
                            getTagsComparision(
                                activeConflict.original.tags,
                                activeConflict.ours ? activeConflict.ours.tags : undefined,
                                activeConflict.theirs ? activeConflict.theirs.tags : undefined,
                            ).map(({
                                title,

                                original,
                                ours,
                                theirs,

                                oursChanged,
                                theirsChanged,
                                conflicted,
                            }) => (
                                <div className={styles.tag}>
                                    <div className={styles.originalTag}>
                                        {original && (
                                            <div className={styles.input}>
                                                <div className={styles.title}>
                                                    {title}
                                                </div>
                                                <div className={styles.value}>
                                                    {original}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.oursTag}>
                                        {ours && (
                                            <div className={styles.input}>
                                                <div className={styles.title}>
                                                    {title}
                                                </div>
                                                <div className={styles.value}>
                                                    {ours}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {theirs && (
                                        <div className={styles.theirsTag}>
                                            <div className={styles.input}>
                                                <div className={styles.title}>
                                                    {title}
                                                </div>
                                                <div className={styles.value}>
                                                    {theirs}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        }
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
