import React from 'react';
import {
    _cs,
    union,
    isDefined,
    listToMap,
} from '@togglecorp/fujs';
import {
    buffer,
    bbox,
} from '@turf/turf';
import memoize from 'memoize-one';

import List from '#rsu/../v2/View/List';
import Message from '#rsu/../v2/View/Message';
import LoadingAnimation from '#rscv/LoadingAnimation';
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
    Bounds,
    ElementGeoJSON,
    ShapeType,
} from '#constants/types';

import Row from '../Row';
import TagRow from '../TagRow';
import ConflictMap from '../ConflictMap';
import {
    TagStatus,
    ResolveOrigin,
} from '../types';

import styles from './styles.scss';

interface Resolution {
    [key: string]: 'ours' | 'theirs' | undefined;
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
    tags?: unknown;
    location?: unknown;
    conflictingNodes?: unknown;

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
                const myResponse = response as Response;
                const { resolvedData } = myResponse;
                // FIXME: we don't do this here
                // setResolution(resolvedData);
            }
        },
    },
    conflictUpdate: {
        url: ({ props: { activeConflictId } }) => `/conflicts/${activeConflictId}/update/`,
        method: methods.PATCH,
        body: ({ params }) => params && ({
            tags: params.tags,
            location: params.location,
            conflictingNodes: params.conflictingNodes,
        }),
        onMount: false,
    },
    conflictResolve: {
        url: ({ props: { activeConflictId } }) => `/conflicts/${activeConflictId}/resolve/`,
        method: methods.PATCH,
        body: ({ params }) => params && ({
            tags: params.tags,
            location: params.location,
            conflictingNodes: params.conflictingNodes,
        }),
        onMount: false,
    },
};

const getBounds = (geoJson: ElementGeoJSON) => {
    const shape = buffer(geoJson, 0.5, { units: 'kilometers' });
    // NOTE: bbox also support 3d bbox
    return bbox(shape) as Bounds;
};

function getShapeType(geoJson: ElementGeoJSON): ShapeType {
    const { geometry: { type } } = geoJson;
    if (type === 'Point' || type === 'MultiPoint') {
        return 'point';
    }
    if (type === 'LineString' || type === 'MultiLineString') {
        return 'line';
    }
    if (type === 'Polygon' || type === 'MultiPolygon') {
        return 'area';
    }

    return 'point';
}

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

    private getActiveConflict = memoize((conflict: ConflictElement) => ({
        type: getShapeType(conflict.originalGeojson),
        name: conflict.name,
        id: conflict.elementId,
        original: {
            geoJSON: conflict.originalGeojson,
            bounds: getBounds(conflict.originalGeojson),
            meta: {
                id: conflict.originalGeojson.properties.id,
                version: conflict.originalGeojson.properties.version,
            },
            tags: conflict.originalGeojson.properties.tags,
            location: conflict.originalGeojson.properties.location,
            conflictingNodes: conflict.originalGeojson.properties.conflictingNodes,
        },
        ours: {
            geoJSON: conflict.localGeojson,
            bounds: getBounds(conflict.localGeojson),
            meta: {
                id: conflict.localGeojson.properties.id,
                version: conflict.localGeojson.properties.version,
            },
            tags: conflict.localGeojson.properties.tags,
            location: conflict.localGeojson.properties.location,
            conflictingNodes: conflict.localGeojson.properties.conflictingNodes,
        },
        theirs: {
            geoJSON: conflict.upstreamGeojson,
            bounds: getBounds(conflict.upstreamGeojson),
            meta: {
                id: conflict.upstreamGeojson.properties.id,
                version: conflict.upstreamGeojson.properties.version,
            },
            tags: conflict.upstreamGeojson.properties.tags,
            location: conflict.upstreamGeojson.properties.location,
            conflictingNodes: conflict.upstreamGeojson.properties.conflictingNodes,
        },
    }));

    private getTagsComparision = memoize((
        original: Tags | undefined,
        prev: Tags | undefined,
        next: Tags | undefined,
    ): TagStatus[] => {
        if (!original) {
            return [];
        }
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
    })

    private getVariousData = memoize((conflictElement: ConflictElement, resolution: Resolution) => {
        const activeConflict = this.getActiveConflict(conflictElement);

        const {
            original,
            ours,
            theirs,
        } = activeConflict;

        // General
        const tags = this.getTagsComparision(
            original.tags,
            ours?.tags,
            theirs?.tags,
        );

        const conflictedTags = tags.filter(tag => tag.conflicted);
        const resolvedTags = conflictedTags.filter(item => resolution[item.title]);

        // For map row
        const oursMapSelected = resolution.$map === 'ours';
        const theirsMapSelected = resolution.$map === 'theirs';
        const mapSelected = oursMapSelected || theirsMapSelected;

        const mapConflicted = !!ours
            && !!theirs
            && JSON.stringify(ours.geoJSON?.geometry) !== JSON.stringify(theirs.geoJSON?.geometry);

        // For Info row
        let resolvedCount = resolvedTags.length;
        let conflictedCount = conflictedTags.length;
        if (mapConflicted) {
            conflictedCount += 1;
        }
        if (mapConflicted && mapSelected) {
            resolvedCount += 1;
        }

        const modifiedMode = !!ours && !!theirs;

        // For Tag row
        const originalTagCount = Object.keys(original.tags || {}).length;
        const oursTagCount = Object.keys(ours?.tags || {}).length;
        const theirsTagCount = Object.keys(theirs?.tags || {}).length;

        return {
            activeConflict,
            resolvedCount,
            conflictedCount,
            modifiedMode,
            originalTagCount,
            oursTagCount,
            theirsTagCount,
            tags,
            conflictedTags,
            mapSelected,
            oursMapSelected,
            theirsMapSelected,
            mapConflicted,
        };
    })

    private handleCheckboxChange = (value: boolean) => {
        this.setState({ showOnlyConflicts: value });
    }

    private setResolution = (resolvedData: object) => {
        this.setState({
            resolution: resolvedData.tags || {},
        });
    }

    private handleMapClick = (origin: ResolveOrigin | undefined) => {
        this.handleTagClick('$map', origin);
    }

    private handleResolve = () => {
        const {
            requests: {
                conflictUpdate,
                conflictResolve,
                conflictGet: {
                    response,
                },
            },
        } = this.props;
        const { resolution } = this.state;

        if (!response) {
            return;
        }
        const {
            resolvedCount,
            conflictedCount,
            activeConflict,
            tags,
        } = this.getVariousData(response as ConflictElement, resolution);

        const mappedTags = listToMap(
            tags,
            tag => tag.title,
            (tag, key) => {
                if (resolution[key] === 'ours') {
                    return tag.oursValue;
                }
                if (resolution[key] === 'theirs') {
                    return tag.theirsValue;
                }
                return undefined;
            },
        );

        let location;
        if (resolution.$map === 'ours') {
            ({ location } = activeConflict.ours);
        } else if (resolution.$map === 'theirs') {
            ({ location } = activeConflict.theirs);
        }

        let conflictingNodes;
        if (resolution.$map === 'ours') {
            ({ conflictingNodes } = activeConflict.ours);
        } else if (resolution.$map === 'theirs') {
            ({ conflictingNodes } = activeConflict.theirs);
        }

        const params = {
            location,
            conflictingNodes,
            tags: mappedTags,
        };

        console.warn(params);

        if (resolvedCount === conflictedCount) {
            conflictResolve.do(params);
        } else {
            conflictUpdate.do(params);
        }
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
            const newOrigin = resolution[key] === origin ? undefined : origin;
            const newResolution = {
                ...resolution,
                [key]: newOrigin,
            };
            return { ...state, resolution: newResolution };
        });
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
        const {
            activeConflictId,
            className,
            requests: {
                conflictGet: {
                    response,
                    pending,
                },
            },
        } = this.props;

        if (!activeConflictId) {
            return (
                <Message>
                    Please select a conflict to continue.
                </Message>
            );
        }

        if (pending || !response) {
            return (
                <div className={_cs(styles.content, className)}>
                    <LoadingAnimation />
                </div>
            );
        }

        const {
            showOnlyConflicts,
            resolution,
        } = this.state;

        const {
            activeConflict,
            resolvedCount,
            conflictedCount,
            modifiedMode,
            originalTagCount,
            oursTagCount,
            theirsTagCount,
            tags,
            conflictedTags,
            mapSelected,
            oursMapSelected,
            theirsMapSelected,
            mapConflicted,
        } = this.getVariousData(response as ConflictElement, resolution);

        const {
            type,
            original,
            ours,
            theirs,
        } = activeConflict;

        return (
            <div className={_cs(styles.content, className)}>
                <div className={styles.headerContainer}>
                    <h1 className={styles.title}>
                        { activeConflict.name }
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
                                    onClick={this.handleResolve}
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
