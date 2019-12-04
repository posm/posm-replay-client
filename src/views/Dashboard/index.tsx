import React from 'react';
import { _cs } from '@togglecorp/fujs';

import Map from '#re-map';
import MapContainer from '#re-map/MapContainer';
import MapBounds from '#re-map/MapBounds';
import Button from '#rsu/../v2/Action/Button';
// import MapSource from '#re-map/MapSource';
// import MapLayer from '#re-map/MapSource/MapLayer';
// import Message from '#rscv/Message';
// import Icon from '#rscg/Icon';

import TextOutput from '#components/TextOutput';
import Info from '#components/Info';
import ProgressBar from '#components/ProgressBar';
import TaskItem from '#components/TaskItem';

/*
import Redux from 'redux';
import { connect } from 'react-redux';
import { Obj } from '@togglecorp/fujs';

import { AppState } from '#store/types';
import * as PageTypes from '#store/atom/page/types';
import {
    createConnectedRequestCoordinator,
    createRequestClient,
    NewProps,
    ClientAttributes,
    methods,
} from '#request';
*/

/*
import {
    setAlertListActionDP,
    setEventListAction,
} from '#actionCreators';
import {
    alertListSelectorDP,
    eventListSelector,
    hazardTypesSelector,
    filtersValuesSelectorDP,
} from '#selectors';
 */

import styles from './styles.scss';

const nepalCenter: [number, number] = [
    84.1240, 28.3949,
];

const nepalBounds: [number, number, number, number] = [
    80.05858661752784, 26.347836996368667,
    88.20166918432409, 30.44702867091792,
];

const lalitpurBounds: [number, number, number, number] = [
    85.31066555023207,
    27.67117097577173,
    85.32710212707534,
    27.682648488328013,
];


const mapOptions = {
    zoomLevel: 3,
    center: nepalCenter,
    bounds: lalitpurBounds,
};

interface State {
}
interface Params {
    // triggerAlertRequest: (timeout: number) => void;
}
interface OwnProps {
    className?: string;
}

type Props = OwnProps;
/*
interface PropsFromState {
    alertList: PageTypes.Alert[];
    eventList: PageTypes.Event[];
    hazardTypes: Obj<PageTypes.HazardType>;
    filters: PageTypes.FiltersWithRegion['faramValues'];
}
interface PropsFromDispatch {
    setEventList: typeof setEventListAction;
    setAlertList: typeof setAlertListActionDP;
}
type ReduxProps = OwnProps & PropsFromState & PropsFromDispatch;
type Props = NewProps<ReduxProps, Params>;
*/

/*
const mapStateToProps = (state: AppState): PropsFromState => ({
    alertList: alertListSelectorDP(state),
    eventList: eventListSelector(state),
    hazardTypes: hazardTypesSelector(state),
    filters: filtersValuesSelectorDP(state),
});

const mapDispatchToProps = (dispatch: Redux.Dispatch): PropsFromDispatch => ({
    setAlertList: params => dispatch(setAlertListActionDP(params)),
    setEventList: params => dispatch(setEventListAction(params)),
});

const requests: { [key: string]: ClientAttributes<ReduxProps, Params> } = {
    alertsRequest: {
        url: '/alert/',
        method: methods.GET,
        // We have to transform dateRange to created_on__lt and created_on__gt
        query: ({ props: { filters } }) => ({
            ...transformDateRangeFilterParam(filters, 'created_on'),
            expand: ['event'],
            ordering: '-created_on',
        }),
        onSuccess: ({ response, props: { setAlertList }, params }) => {
            interface Response { results: PageTypes.Alert[] }
            const { results: alertList = [] } = response as Response;
            setAlertList({ alertList });
            if (params && params.triggerAlertRequest) {
                params.triggerAlertRequest(60 * 1000);
            }
        },
        onFailure: ({ params }) => {
            if (params && params.triggerAlertRequest) {
                params.triggerAlertRequest(60 * 1000);
            }
        },
        onFatal: ({ params }) => {
            if (params && params.triggerAlertRequest) {
                params.triggerAlertRequest(60 * 1000);
            }
        },
        onMount: true,
        onPropsChanged: {
            filters: ({
                props: { filters: { hazard, dateRange, region } },
                prevProps: { filters: {
                    hazard: prevHazard,
                    dateRange: prevDateRange,
                    region: prevRegion,
                } },
            }) => (
                hazard !== prevHazard || dateRange !== prevDateRange || region !== prevRegion
            ),
        },
        extras: {
            schemaName: 'alertResponse',
        },
    },
};
*/

const mapStyle: mapboxgl.MapboxOptions['style'] = {
    version: 8,
    name: 'Base Layer',
    sources: {
        mm: {
            type: 'raster',
            url: process.env.REACT_APP_OSM_LAYER_URL,
            tileSize: 256,
        },
    },
    layers: [
        {
            id: 'background',
            type: 'background',
            paint: { 'background-color': 'rgb(239, 239, 239)' },
        },
        {
            id: 'mm_layer',
            type: 'raster',
            source: 'mm',
        },
    ],
};

// eslint-disable-next-line react/prefer-stateless-function
class Dashboard extends React.PureComponent<Props, State> {
    private handleStartButtonClick = () => {
        console.warn('starting...');
    }

    public render() {
        const {
            className,
        } = this.props;

        const data = {
            locationName: 'Lalitpur',
            dateExtracted: '2019-12-02',
            localChanges: '12',
            resolvedConflicts: 0,
            totalConflicts: 35,
        };

        return (
            <div className={_cs(className, styles.dashboard)}>
                <div className={styles.sidebar}>
                    <h2 className={styles.heading}>
                        { data.locationName }
                    </h2>
                    <div className={styles.details}>
                        <TextOutput
                            label="Date extracted"
                            value={data.dateExtracted}
                        />
                        <TextOutput
                            label="Local changesets"
                            value={data.localChanges}
                        />
                    </div>
                    <div className={styles.actions}>
                        <Button
                            buttonType="button-primary"
                            className={styles.startButton}
                            onClick={this.handleStartButtonClick}
                        >
                            Start
                        </Button>
                    </div>
                    <Info
                        className={styles.info}
                        message="The replay tool has not been started!"
                    />

                    <div className={styles.progress}>
                        <h3 className={styles.heading}>
                            Progress
                        </h3>
                        <ProgressBar
                            className={styles.progressBar}
                            progress={50}
                        />
                        <div className={styles.taskList}>
                            <TaskItem
                                className={styles.taksItem}
                                status="completed"
                                label="Gathering changesets"
                            />
                            <TaskItem
                                className={styles.taksItem}
                                status="pending"
                                label="Extracting upstream AOI"
                            />
                            <TaskItem
                                className={styles.taksItem}
                                status="failed"
                                label="Extracting local AOI"
                            />
                            <TaskItem
                                className={styles.taksItem}
                                status="not-initiated"
                                label="Filtering referenced elements"
                            />
                            <TaskItem
                                className={styles.taksItem}
                                status="not-initiated"
                                label="Identifying conflicts"
                            />
                        </div>
                    </div>

                    <div className={styles.conflicts}>
                        <h3 className={styles.heading}>
                            Conflicts
                        </h3>
                        <ProgressBar
                            className={styles.progressBar}
                            progress={10}
                        />
                        <div className={styles.conflictStatus}>
                            <div className={styles.resolvedConflicts}>
                                {data.resolvedConflicts}
                            </div>
                            <div className={styles.separator}>
                                of
                            </div>
                            <div className={styles.totalConflicts}>
                                {data.totalConflicts}
                            </div>
                            <div className={styles.postLabel}>
                                conflicts resolved
                            </div>
                        </div>
                        <div className={styles.actions}>
                            <Button
                                buttonType="button-primary"
                                className={styles.resolveConflictButton}
                                onClick={this.handleResolveConflictButtonClick}
                            >
                                Resolve conflicts
                            </Button>
                        </div>
                    </div>
                </div>
                <Map
                    mapStyle={mapStyle}
                    mapOptions={mapOptions}
                    scaleControlShown
                    navControlShown
                >
                    <MapBounds
                        bounds={mapOptions.bounds}
                        padding={50}
                    />
                    <MapContainer
                        className={styles.map}
                    />
                </Map>
                {/*
                <Message className={styles.message}>
                    <Icon
                        className={styles.icon}
                        name="dashboard"
                    />
                    Dashboard goes here
                </Message>
                */}
            </div>
        );
    }
}

export default Dashboard;
/*
export default connect(mapStateToProps, mapDispatchToProps)(
    createConnectedRequestCoordinator<ReduxProps>()(
        createRequestClient(requests)(
            Dashboard,
        ),
    ),
);
*/
