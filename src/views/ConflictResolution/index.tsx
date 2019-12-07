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

import styles from './styles.scss';

const TagForCollege: Tags = {
    'addr:street': 'Chakupat',
    building: 'college',
    // eslint-disable-next-line camelcase, @typescript-eslint/camelcase
    int_name: 'Nepal Bhasa Central Department',
    name: 'Nepal Bhasa Central Department',
    'name:ne': 'चैन लाकौल स्मृति भवन',
};

const TagForCollege2: Tags = {
    building: 'college',
    name: 'Nepal Bhasa Central Departments',
};

const TagForCompany: Tags = {
    'addr:city': 'Lalitpur',
    'addr:street': 'Mitra Marg',
    building: 'yes',
    name: 'Max Media Pvt ltd',
    office: 'company',
    // eslint-disable-next-line camelcase, @typescript-eslint/camelcase
    opening_hours: '10:00-18:00',
    smoking: 'outside',
    source: 'NextView',
};

const TagForSchool: Tags = {
    amenity: 'school',
    // eslint-disable-next-line camelcase, @typescript-eslint/camelcase
    building_count: '3',
    'isced:level': 'secondary',
    name: 'Eden Garden Secondary School',
    'operator:type': 'private',
    'personnel:count': '40',
    source: 'OpenDRI survey',
    'student:count': '600',
};

const TagForEqArea: Tags = {
    'damage:event': 'nepal_earthquake_2015',
    'idp:camp_site': 'spontaneous_camp',
    'idp:source_20150427': 'Pleiades, CNES, Airbus DS',
    'idp:status_20150427': 'new',
    leisure: 'park',
    name: 'Imukhel Baal Udyaan(childresn\'s park)',
};

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

const { all, altered } = identifyChanges(TagForCollege, TagForCollege2);
const iterTagsOne = getIterableTags(TagForCollege, all, altered);
console.warn(iterTagsOne);
const iterTagsTwo = getIterableTags(TagForCollege2, all, altered);
console.warn(iterTagsTwo);

const conflictList: ConflictElement[] = [
    {
        resolutionStatus: 'resolved',
        id: '6',
        title: 'Building around Police Chowk',
        type: 'area',
        original: {
            meta: {
                id: 1,
                version: 1,
            },
            tags: TagForEqArea,
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
        title: 'Residential road near Kupondole',
        type: 'line',
        original: {
            meta: {
                id: 1,
                version: 1,
            },
            tags: TagForSchool,
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
        title: 'College around Jawalakhel',
        type: 'point',
        original: {
            meta: {
                id: 1,
                version: 1,
            },
            tags: TagForCollege,
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
