export type ResolutionStatus = 'conflicted' | 'resolved' | 'partially-resolved';
export type ElementType = 'point' | 'line' | 'area';
export type Bounds = [number, number, number, number];

interface Meta {
    id: number;
    version: number;
    user?: string;
    uid?: number;
    timestamp?: string;
    visible?: boolean;
    changeset?: number;
};

interface Tag {
    key: string;
    value: string;
};

export type Content = {
    meta: Meta;
    tags: Tag[];
    bounds: Bounds;
    geoJSON?: GeoJSON.Feature<GeoJSON.Geometry> | GeoJSON.FeatureCollection<GeoJSON.Geometry>;
}

export interface ConflictElement {
    id: string;
    title: string;
    resolutionStatus: ResolutionStatus;
    type: ElementType; // IDK about this

    original: Content,
    theirs?: Content,
    ours?: Content,
}

// For nodes:
// Show the node; If part of way show them

// For way:
// Show everything inside it

// For relation:
// Show everything inside it
