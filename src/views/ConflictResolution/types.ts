export interface TagStatus {
    title: string;
    originalValue: string | undefined;

    oursDefined: boolean;
    theirsDefined: boolean;

    oursValue: string | undefined;
    oursChanged: boolean;

    theirsValue: string | undefined;
    theirsChanged: boolean;

    conflicted: boolean;
}

export type ResolveOrigin = 'theirs' | 'ours';
