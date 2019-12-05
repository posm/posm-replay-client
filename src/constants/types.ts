export type ResolutionStatus = 'conflicted' | 'resolved' | 'partially-resolved';
export type ElementType = 'node' | 'way' | 'relation';
export type Bounds = [number, number, number, number];

interface Meta {
    id: number;
    user: string;
    uid: number;
    timestamp: string;
    visible?: boolean;
    version: number;
    changeset: number;
};

interface Tag {
    key: string;
    value: string;
};

export type Content = {
    type: ElementType;
    meta: Meta;
    tags: Tag[];
    bounds: Bounds;
}

export interface ConflictElement {
    id: string;
    title: string;
    resolutionStatus: ResolutionStatus;
    type: ElementType; // IDK about this
    theirs?: Content,
    ours?: Content,
}

// For nodes:
// Show the node; If part of way show them

// For way:
// Show everything inside it

// For relation:
// Show everything inside it
