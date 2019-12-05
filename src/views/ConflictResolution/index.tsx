import React from 'react';
import { _cs } from '@togglecorp/fujs';

import ListView from '#rsu/../v2/View/ListView';
import Message from '#rsu/../v2/View/Message';

import ProgressBar from '#components/ProgressBar';
import ConflictStatus from '#components/ConflictStatus';
import { ConflictElement } from '#constants/types';

import ConflictDetail from './ConflictDetail';
import ConflictListItem from './ConflictListItem';

import styles from './styles.scss';

interface State {
    activeConflictId?: string;
}
interface Params {
    // triggerAlertRequest: (timeout: number) => void;
}
interface OwnProps {
    className?: string;
}
type Props = OwnProps;

const conflictList: ConflictElement[] = [
    {
        resolutionStatus: 'resolved',
        id: '6',
        title: 'School at Sundarijal',
        type: 'area',
        original: {
            meta: {
                id: 1,
                version: 1,
            },
            tags: [
            ],
            bounds: [85.312410593, 27.6733618869, 85.3133171797, 27.6739842374],
            geoJSON: {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'Polygon',
                            coordinates: [
                                [
                                    [
                                        85.31280219554901,
                                        27.673547167176178,
                                    ],
                                    [
                                        85.31292289495468,
                                        27.6735186625387,
                                    ],
                                    [
                                        85.31295239925383,
                                        27.67359467488879,
                                    ],
                                    [
                                        85.3128370642662,
                                        27.673637431812473,
                                    ],
                                    [
                                        85.31280219554901,
                                        27.673547167176178,
                                    ],
                                ],
                            ],
                        },
                    },
                ],
            },
        },
    },
    {
        resolutionStatus: 'conflicted',
        id: '2',
        title: 'Bridge near Kupondole',
        type: 'line',
        original: {
            meta: {
                id: 1,
                version: 1,
            },
            tags: [
            ],
            bounds: [85.3149935603, 27.6731611662, 85.3162327409, 27.67385953],
            geoJSON: {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'LineString',
                            coordinates: [
                                [
                                    85.31567752361298,
                                    27.673478280956203,
                                ],
                                [
                                    85.3154468536377,
                                    27.673535290244793,
                                ],
                                [
                                    85.31539589166641,
                                    27.673449776300735,
                                ],
                                [
                                    85.31525641679764,
                                    27.673480656343823,
                                ],
                            ],
                        },
                    },
                ],
            },
        },
    },

    {
        resolutionStatus: 'partially-resolved',
        id: '3',
        title: 'Hospital in Bhaisepati',
        type: 'point',
        original: {
            meta: {
                id: 1,
                version: 1,
            },
            tags: [
            ],
            bounds: [85.3139528632, 27.6737027549, 85.3151008487, 27.6743393556],
            geoJSON: {
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'Point',
                    coordinates: [
                        85.31453222036362,
                        27.673962858961108,
                    ],
                },
            },
        },
    },
];

const conflictKeySelector = (d: ConflictElement) => d.id;

// TODO: show type

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
                    <ConflictDetail
                        data={activeConflict}
                        className={styles.conflictDetail}
                    />
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
