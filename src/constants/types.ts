import { Feature, FeatureCollection, Geometry } from '@turf/turf';

export type ResolutionStatus = 'conflicted' | 'resolved' | 'partially-resolved';
export type ElementType = 'point' | 'line' | 'area' | 'node';
export type Bounds = [number, number, number, number];

interface ElementProperties {
    id: number;
    version: number;
    tags: Tags;
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

export interface ConflictElement {
    id: number;
    name: string;
    elementId: number;
    resolutionStatus: ResolutionStatus;
    type: ElementType; // IDK about this

    // NOTE: are these used?
    // original: Content;
    // theirs?: Content;
    // ours?: Content;

    originalGeojson: ElementGeoJSON;
    localGeojson: ElementGeoJSON;
    upstreamGeojson: ElementGeoJSON;
}

// For nodes:
// Show the node; If part of way show them

// For way:
// Show everything inside it

// For relation:
// Show everything inside it
