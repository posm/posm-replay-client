import { Feature, FeatureCollection, Geometry } from '@turf/turf';
export type ResolutionStatus = 'conflicted' | 'resolved' | 'partially-resolved';
export type ElementType = 'point' | 'line' | 'area' | 'node';
export type Bounds = [number, number, number, number];

interface Meta {
    id: number;
    version: number;
    user?: string;
    uid?: number;
    timestamp?: string;
    visible?: boolean;
    changeset?: number;
}

export interface Tags {
    [key: string]: string | undefined;
}

export interface Content {
    meta: Meta;
    tags: Tags;
    bounds: Bounds;
    geoJSON?: GeoJSON.Feature<GeoJSON.Geometry> | GeoJSON.FeatureCollection<GeoJSON.Geometry>;
}

export interface ConflictElement {
    id: number;
    name: string;
    elementId: number;
    resolutionStatus: ResolutionStatus;
    type: ElementType; // IDK about this

    original: Content;
    theirs?: Content;
    ours?: Content;
    originalGeojson: object;
    localGeojson: object;
    upstreamGeojson: object;
}

// For nodes:
// Show the node; If part of way show them

// For way:
// Show everything inside it

// For relation:
// Show everything inside it
