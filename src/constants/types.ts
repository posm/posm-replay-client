import { Feature, Geometry } from '@turf/turf';

export type ResolutionStatus = 'unresolved' | 'resolved' | 'partially_resolved';
export type ElementType = 'node' | 'way' | 'relation';
export type ShapeType = 'point' | 'line' | 'area';
export type Bounds = [number, number, number, number];

interface ElementProperties {
    id: number;
    version: number;
    tags: Tags;
    location?: unknown;
    conflictingNodes?: unknown;
}

export type ElementGeoJSON = GeoJSON.Feature<GeoJSON.Geometry, ElementProperties>;
//     | GeoJSON.FeatureCollection<GeoJSON.Geometry, ElementProperties>;

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

/*
export interface Content {
    meta: Meta;
    tags: Tags;
    bounds: Bounds;
    geoJSON?: ElementGeoJSON;
}
*/

export interface BasicConflictElement {
    elementId: number;
    id: number;
    name: string;
    type: ElementType; // IDK about this
    status: ResolutionStatus;
}

export interface ConflictElement extends BasicConflictElement {
    originalGeojson: ElementGeoJSON;
    localGeojson?: ElementGeoJSON;
    upstreamGeojson?: ElementGeoJSON;
    resolvedData: {
        id: number;
        tags?: Tags;
        location?: unknown;
        conflictingNodes?: unknown;
    };
}

// For nodes:
// Show the node; If part of way show them

// For way:
// Show everything inside it

// For relation:
// Show everything inside it
