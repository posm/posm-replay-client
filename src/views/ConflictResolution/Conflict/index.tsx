import React from 'react';
import {
    _cs,
    union,
    isDefined,
} from '@togglecorp/fujs';
import {
    buffer,
    bbox,
    Feature,
    Geometry,
    FeatureCollection,
} from '@turf/turf';

import List from '#rsu/../v2/View/List';
import Message from '#rsu/../v2/View/Message';
import Button from '#rsu/../v2/Action/Button';
import Checkbox from '#rsu/../v2/Input/Checkbox';
import ProgressBar from '#components/ProgressBar';
import ConflictStatus from '#components/ConflictStatus';

import {
    createConnectedRequestCoordinator,
    createRequestClient,
    methods,
    NewProps,
    ClientAttributes,
} from '#request';

import {
    Tags,
    ConflictElement,
} from '#constants/types';

import Row from '../Row';
import TagRow from '../TagRow';
import ConflictMap from '../ConflictMap';
import {
    TagStatus,
    ResolveOrigin,
} from '../types';

import styles from './styles.scss';

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

interface Resolution {
    [key: string]: string;
}

interface OwnProps {
    className?: string;
    activeConflictId?: number;
}

interface State {
    showOnlyConflicts: boolean;
    resolution: Resolution;
}

const rowKeySelector = (t: TagStatus) => t.title;

interface Params {
    resolution?: object;
    setResolution?: (resolvedData: object) => void;
}

interface Response {
    resolvedData: object;
}
type Props = NewProps<OwnProps, Params>;

const requestOptions: { [key: string]: ClientAttributes<OwnProps, Params> } = {
    conflictGet: {
        url: ({ props: { activeConflictId } }) => `/conflicts/${activeConflictId}/`,
        method: methods.GET,
        onMount: ({ props: { activeConflictId } }) => isDefined(activeConflictId),
        onSuccess: ({
            params,
            response,
        }) => {
            if (!params) {
                return;
            }
            const { setResolution } = params;
            if (setResolution) {
                const { resolvedData } = response as Response;
                setResolution(resolvedData);
            }
        },
    },
    conflictUpdate: {
        url: ({ props: { activeConflictId } }) => `/conflicts/${activeConflictId}/update/`,
        method: methods.PATCH,
        body: ({ params }) => params && params.resolution,
        onMount: false,
    },
};

const getBounds = (geoJson: (Feature<any> | FeatureCollection | Geometry)) => {
    const shape = buffer(geoJson, 0.5, { units: 'kilometers' });
    return bbox(shape);
};

class Conflict extends React.PureComponent<Props, State> {
    public constructor(props: Props) {
        super(props);

        const {
            requests: {
                conflictGet,
            },
        } = this.props;
        conflictGet.setDefaultParams({ setResolution: this.setResolution });

        this.state = {
            showOnlyConflicts: true,

            resolution: {},
        };
    }

    private getActiveConflict = (conflict: ConflictElement) => ({
        type: conflict.type === 'node' ? 'point' : conflict.type,
        id: conflict.elementId,
        original: {
            geoJSON: conflict.originalGeojson,
            bounds: getBounds(conflict.originalGeojson),
            meta: {
                id: conflict.originalGeojson.properties.id,
                version: conflict.originalGeojson.properties.version,
            },
            tags: conflict.originalGeojson.properties.tags,
        },
        ours: {
            geoJSON: conflict.localGeojson,
            bounds: getBounds(conflict.localGeojson),
            meta: {
                id: conflict.localGeojson.properties.id,
                version: conflict.localGeojson.properties.version,
            },
            tags: conflict.localGeojson.properties.tags,
        },
        theirs: {
            geoJSON: conflict.upstreamGeojson,
            bounds: getBounds(conflict.upstreamGeojson),
            meta: {
                id: conflict.upstreamGeojson.properties.id,
                version: conflict.upstreamGeojson.properties.version,
            },
            tags: conflict.upstreamGeojson.properties.tags,
        },
    });

    private handleCheckboxChange = (value: boolean) => {
        this.setState({ showOnlyConflicts: value });
    }

    private setResolution = (resolvedData: object) => {
        this.setState({
            resolution: resolvedData.tags,
        });
    }

    private handleMapClick = (origin: ResolveOrigin | undefined) => {
        this.handleTagClick('$map', origin);
    }

    private handleUpdate = () => {
        const {
            requests: {
                conflictUpdate,
            },
        } = this.props;
        const { resolution } = this.state;
        conflictUpdate.do({
            resolution: {
                tags: resolution,
            },
        });

        // conflictUpdate.do({ });
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

    private handleTagClick = (key: string, _: ResolveOrigin | undefined, value?: string) => {
        this.setState((state) => {
            const { resolution } = state;
            const newResolution = {
                ...resolution,
                [key]: value === resolution[key] ? undefined : value,
            };
            return { ...state, resolution: newResolution };
        });
    }

    private rowRendererParams = (key: string, item: TagStatus) => {
        const { resolution } = this.state;

        const oursSelected = resolution[key] === item.oursValue;
        const theirsSelected = resolution[key] === item.theirsValue;
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
        const {
            activeConflictId,
            className,
            requests: {
                conflictGet: {
                    response,
                },
            },
        } = this.props;

        if (!activeConflictId || !response) {
            return (
                <Message>
                    Please select a conflict to continue.
                </Message>
            );
        }

        const activeConflict = this.getActiveConflict(response as ConflictElement);

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
        const mapConflicted = !!ours
        && !!theirs
        && JSON.stringify(ours.geoJSON?.geometry) !== JSON.stringify(theirs.geoJSON?.geometry);
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

        return (
            <div className={_cs(styles.content, className)}>
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
                                    onClick={this.handleUpdate}
                                    buttonType="button-primary"
                                >
                                    Update
                                </Button>
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
    }
}

export default createConnectedRequestCoordinator<OwnProps>()(
    createRequestClient(requestOptions)(Conflict),
);
