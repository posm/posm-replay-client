import { ConflictElement, Tags } from '#constants/types';

const geoJSONForBuilding: GeoJSON.FeatureCollection<GeoJSON.Geometry> = {
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
};

const geoJSONForRoad: GeoJSON.FeatureCollection<GeoJSON.Geometry> = {
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
};

const geoJSONForPoint: GeoJSON.Feature<GeoJSON.Geometry> = {
    type: 'Feature',
    properties: {},
    geometry: {
        type: 'Point',
        coordinates: [
            85.31453222036362,
            27.673962858961108,
        ],
    },
};

const tagForCollege: Tags = {
    'addr:street': 'Chakupat',
    building: 'college',
    // eslint-disable-next-line camelcase, @typescript-eslint/camelcase
    int_name: 'Nepal Bhasa Central Department',
    name: 'Nepal Bhasa Central Department',
    'name:ne': 'चैन लाकौल स्मृति भवन',
};

/*
const tagForCollege2: Tags = {
    building: 'college',
    name: 'Nepal Bhasa Central Departments',
};

const tagForCompany: Tags = {
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
 */

const tagForSchool: Tags = {
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

const tagForEqArea: Tags = {
    'damage:event': 'nepal_earthquake_2015',
    'idp:camp_site': 'spontaneous_camp',
    'idp:source_20150427': 'Pleiades, CNES, Airbus DS',
    'idp:status_20150427': 'new',
    leisure: 'park',
    name: 'Imukhel Baal Udyaan(childresn\'s park)',
};

// eslint-disable-next-line import/prefer-default-export
export const conflictList: ConflictElement[] = [
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
            tags: tagForEqArea,
            bounds: [85.312410593, 27.6733618869, 85.3133171797, 27.6739842374],
            geoJSON: geoJSONForBuilding,
        },
        ours: {
            meta: {
                id: 1,
                version: 3,
            },
            tags: {
                ...tagForEqArea,
                leisure: 'playground',
                'damage:event': 'nepal earthquake 2015',
                'damage:year': '2015',
                'ipd:status_20150427': undefined,
                'idp:camp_site': 'spontaneous camp',
            },
            bounds: [85.312410593, 27.6733618869, 85.3133171797, 27.6739842374],
            geoJSON: geoJSONForBuilding,
        },
        theirs: {
            meta: {
                id: 1,
                version: 2,
            },
            tags: {
                ...tagForEqArea,
                leisure: 'play-ground',
                'damage:event': undefined,
                'damage:project': 'nepal earthquake 2015',
                'ipd:status_20150427': 'confirmed',
            },
            bounds: [85.312410593, 27.6733618869, 85.3133171797, 27.6739842374],
            geoJSON: geoJSONForBuilding,
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
            tags: tagForSchool,
            bounds: [85.3149935603, 27.6731611662, 85.3162327409, 27.67385953],
            geoJSON: geoJSONForRoad,
        },
        theirs: {
            meta: {
                id: 1,
                version: 1,
            },
            tags: {
                ...tagForSchool,
                'student:count': '890',
                'operator:type': 'public',
                source: undefined,
            },
            bounds: [85.3149935603, 27.6731611662, 85.3162327409, 27.67385953],
            geoJSON: geoJSONForRoad,
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
            tags: tagForCollege,
            bounds: [85.3139528632, 27.6737027549, 85.3151008487, 27.6743393556],
            geoJSON: geoJSONForPoint,
        },
        ours: {
            meta: {
                id: 1,
                version: 1,
            },
            tags: {
                ...tagForCollege,
                'name:ne': undefined,
                'add:street': 'Chakupat',
                'add:ward': '10',
            },
            bounds: [85.3139528632, 27.6737027549, 85.3151008487, 27.6743393556],
            geoJSON: geoJSONForPoint,
        },
    },
];
