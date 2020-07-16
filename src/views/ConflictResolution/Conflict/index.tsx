import React from 'react';
import {
    _cs,
    union,
    isDefined,
    listToMap,
    mapToMap,
    doesObjectHaveNoData,
} from '@togglecorp/fujs';
import {
    buffer,
    bbox,
} from '@turf/turf';
import {
    RiCheckboxCircleLine,
    RiCheckboxBlankCircleLine,
} from 'react-icons/ri';
import memoize from 'memoize-one';

import List from '#rsu/../v2/View/List';
import Message from '#rsu/../v2/View/Message';
import LoadingAnimation from '#rscv/LoadingAnimation';
import Button from '#rsu/../v2/Action/Button';

import Checkbox from '#components/Checkbox';
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
    ResolutionStatus,
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
    updateConflictStatus: (activeConflictId: number, resolutionStatus: ResolutionStatus) => void;
}

interface State {
    showOnlyConflicts: boolean;
    resolution: Resolution;
    bulkResolution: 'ours' | 'theirs' | 'custom' | null;
}

const rowKeySelector = (t: TagStatus) => t.title;

interface Params {
    tags?: unknown;
    location?: unknown;
    conflictingNodes?: unknown;

    setResolution?: (response: ConflictElement) => void;
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
                const myResponse = response as ConflictElement;
                setResolution(myResponse);
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
        onSuccess: ({ props: {
            updateConflictStatus,
            activeConflictId,
        } }) => {
            if (activeConflictId) {
                updateConflictStatus(activeConflictId, 'partially_resolved');
            }
        },
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
        onSuccess: ({ props: {
            updateConflictStatus,
            activeConflictId,
        } }) => {
            if (activeConflictId) {
                updateConflictStatus(activeConflictId, 'resolved');
            }
        },
        onMount: false,
    },
    useOursRequest: {
        url: ({ props: { activeConflictId } }) => `/conflicts/${activeConflictId}/resolve/ours/`,
        method: methods.PUT,
        onSuccess: ({ props: {
            updateConflictStatus,
            activeConflictId,
        } }) => {
            if (activeConflictId) {
                updateConflictStatus(activeConflictId, 'resolved');
            }
        },
        onMount: false,
    },
    useTheirsRequest: {
        url: ({ props: { activeConflictId } }) => `/conflicts/${activeConflictId}/resolve/theirs/`,
        method: methods.PUT,
        onSuccess: ({ props: {
            updateConflictStatus,
            activeConflictId,
        } }) => {
            if (activeConflictId) {
                updateConflictStatus(activeConflictId, 'resolved');
            }
        },
        onMount: false,
    },
    resetConflictRequest: {
        url: ({ props: { activeConflictId } }) => `/conflicts/${activeConflictId}/reset/`,
        method: methods.PUT,
        onSuccess: ({ props: {
            updateConflictStatus,
            activeConflictId,
        } }) => {
            if (activeConflictId) {
                updateConflictStatus(activeConflictId, 'unresolved');
            }
        },
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
            bulkResolution: null,

            resolution: {},
        };
    }

    private getActiveConflict = memoize((conflict: ConflictElement) => {
        const response = {
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
            ours: (conflict.localGeojson && !doesObjectHaveNoData(conflict.localGeojson))
                ? ({
                    geoJSON: conflict.localGeojson,
                    bounds: getBounds(conflict.localGeojson),
                    meta: {
                        id: conflict.localGeojson.properties.id,
                        version: conflict.localGeojson.properties.version,
                    },
                    tags: conflict.localGeojson.properties.tags,
                    location: conflict.localGeojson.properties.location,
                    conflictingNodes: conflict.localGeojson.properties.conflictingNodes,
                })
                : undefined,
            theirs: (conflict.upstreamGeojson && !doesObjectHaveNoData(conflict.upstreamGeojson))
                ? ({
                    geoJSON: conflict.upstreamGeojson,
                    bounds: getBounds(conflict.upstreamGeojson),
                    meta: {
                        id: conflict.upstreamGeojson.properties.id,
                        version: conflict.upstreamGeojson.properties.version,
                    },
                    tags: conflict.upstreamGeojson.properties.tags,
                    location: conflict.upstreamGeojson.properties.location,
                    conflictingNodes: conflict.upstreamGeojson.properties.conflictingNodes,
                })
                : undefined,
        };
        return response;
    })

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

    private setResolution = (response: ConflictElement) => {
        const {
            type,
            resolvedData: {
                tags = {},
                location,
                conflictingNodes,
            },
            resolvedFrom,
        } = response;

        const activeConflict = this.getActiveConflict(response);

        const resolution = mapToMap(
            tags,
            key => key,
            (elem, key) => {
                if (elem === null) {
                    if (activeConflict.ours?.tags[key] === undefined) {
                        return 'ours';
                    }
                    if (activeConflict.theirs?.tags[key] === undefined) {
                        return 'theirs';
                    }
                    return undefined;
                }

                if (elem === activeConflict.ours?.tags[key]) {
                    return 'ours';
                }
                if (elem === activeConflict.theirs?.tags[key]) {
                    return 'theirs';
                }
                return undefined;
            },
        );

        const { stringify } = JSON;

        if (type === 'node') {
            if (location === null) {
                if (activeConflict.ours?.location === undefined) {
                    resolution.$map = 'ours';
                } else if (activeConflict.theirs?.location === undefined) {
                    resolution.$map = 'theirs';
                }
            } else if (stringify(activeConflict.ours?.location) === stringify(location)) {
                resolution.$map = 'ours';
            } else if (stringify(activeConflict.theirs?.location) === stringify(location)) {
                resolution.$map = 'theirs';
            }
        } else if (type === 'way' || type === 'relation') {
            if (conflictingNodes === null) {
                if (activeConflict.ours?.conflictingNodes === undefined) {
                    resolution.$map = 'ours';
                } else if (activeConflict.theirs?.conflictingNodes === undefined) {
                    resolution.$map = 'theirs';
                }
            } else if (stringify(activeConflict.ours?.conflictingNodes) === stringify(conflictingNodes)) { // eslint-disable-line max-len
                resolution.$map = 'ours';
            } else if (stringify(activeConflict.theirs?.conflictingNodes) === stringify(conflictingNodes)) { // eslint-disable-line max-len
                resolution.$map = 'theirs';
            }
        }

        this.setState({
            resolution,
            bulkResolution: resolvedFrom,
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


        // NOTE: may need to change undefined to null

        const mappedTags = listToMap(
            tags,
            tag => tag.title,
            (tag, key) => {
                if (resolution[key] === 'ours') {
                    return isDefined(tag.oursValue)
                        ? tag.oursValue
                        : null;
                }
                if (resolution[key] === 'theirs') {
                    return isDefined(tag.theirsValue)
                        ? tag.theirsValue
                        : null;
                }
                return undefined;
            },
        );

        let location;
        if (resolution.$map === 'ours') {
            const oursLocation = activeConflict.ours?.location;
            location = isDefined(oursLocation)
                ? oursLocation
                : null;
        } else if (resolution.$map === 'theirs') {
            const theirsLocation = activeConflict.theirs?.location;
            location = isDefined(theirsLocation)
                ? theirsLocation
                : null;
        }

        let conflictingNodes;
        if (resolution.$map === 'ours') {
            const oursConflictingNodes = activeConflict.ours?.conflictingNodes;
            conflictingNodes = isDefined(oursConflictingNodes)
                ? oursConflictingNodes
                : null;
        } else if (resolution.$map === 'theirs') {
            const theirsConflictingNodes = activeConflict.theirs?.conflictingNodes;
            conflictingNodes = isDefined(theirsConflictingNodes)
                ? theirsConflictingNodes
                : null;
        }

        const params = {
            location,
            conflictingNodes,
            tags: mappedTags,
        };

        if (resolvedCount === conflictedCount) {
            conflictResolve.do(params);
        } else {
            conflictUpdate.do(params);
        }
    }

    private handleBulkResolve = () => {
        const {
            requests: {
                useTheirsRequest,
                useOursRequest,
                resetConflictRequest,
            },
        } = this.props;
        const { bulkResolution } = this.state;
        if (bulkResolution === 'ours') {
            useOursRequest.do();
        }
        if (bulkResolution === 'theirs') {
            useTheirsRequest.do();
        }
        if (bulkResolution === null) {
            resetConflictRequest.do();
        }
    }

    private handleBulkOursSelect = () => {
        const { bulkResolution } = this.state;
        this.setState({
            bulkResolution: bulkResolution === 'ours' ? null : 'ours',
        });
    }

    private handleBulkTheirsSelect = () => {
        const { bulkResolution } = this.state;
        this.setState({
            bulkResolution: bulkResolution === 'theirs' ? null : 'theirs',
        });
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
                conflictUpdate: {
                    pending: pendingUpdate,
                },
                conflictResolve: {
                    pending: pendingResolve,
                },
                useOursRequest: {
                    pending: pendingOursRequest,
                },
                useTheirsRequest: {
                    pending: pendingTheirsRequest,
                },
                resetConflictRequest: {
                    pending: pendingReset,
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
            bulkResolution,
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

        const pendingBulkResolve = pendingOursRequest || pendingTheirsRequest;

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
                                    pending={pendingUpdate || pendingResolve}
                                >
                                    Resolve
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    onClick={this.handleBulkResolve}
                                    buttonType="button-primary"
                                    pending={pendingBulkResolve || pendingReset}
                                >
                                    Resolve
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
                            <>
                                <h2>
                                    Ours
                                </h2>
                                {!modifiedMode && (
                                    <Button
                                        className={styles.selectionButton}
                                        buttonType={bulkResolution === 'ours' ? 'button-success' : 'button-default'}
                                        onClick={this.handleBulkOursSelect}
                                    >
                                        {bulkResolution === 'ours'
                                            ? <RiCheckboxCircleLine className={styles.icon} />
                                            : <RiCheckboxBlankCircleLine className={styles.icon} />}
                                        { bulkResolution === 'ours' ? 'Selected' : 'Select' }
                                    </Button>
                                )}
                            </>
                        )}
                        right={(
                            <>
                                <h2>
                                    Theirs
                                </h2>
                                {!modifiedMode && (
                                    <Button
                                        className={styles.selectionButton}
                                        buttonType={bulkResolution === 'theirs' ? 'button-success' : 'button-default'}
                                        onClick={this.handleBulkTheirsSelect}
                                    >
                                        {bulkResolution === 'theirs'
                                            ? <RiCheckboxCircleLine className={styles.icon} />
                                            : <RiCheckboxBlankCircleLine className={styles.icon} />}
                                        { bulkResolution === 'theirs' ? 'Selected' : 'Select' }
                                    </Button>
                                )}
                            </>
                        )}
                    />
                </div>
                <div className={styles.tagRowsContainer}>
                    <Row
                        leftClassName={styles.mapContainer}
                        left={(
                            <ConflictMap
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
                                <Message className={styles.deletedElement}>
                                    The element was deleted!
                                </Message>
                            )
                        }
                        rightClassName={styles.mapContainer}
                        right={
                            theirs ? (
                                <ConflictMap
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
                                <Message className={styles.deletedElement}>
                                    The element was deleted!
                                </Message>
                            )
                        }
                    />
                    <Row
                        left={(
                            <h3>
                                {`Tags (${originalTagCount})`}
                            </h3>
                        )}
                        center={(
                            <h3>
                                { ours ? `Tags (${oursTagCount})` : ''}
                            </h3>
                        )}
                        right={(
                            <h3>
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
