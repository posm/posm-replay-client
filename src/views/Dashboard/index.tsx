import React from 'react';
import { _cs } from '@togglecorp/fujs';

import Message from '#rscv/Message';
import Icon from '#rscg/Icon';

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

// eslint-disable-next-line react/prefer-stateless-function
class Dashboard extends React.PureComponent<Props, State> {
    public render() {
        const { className } = this.props;

        return (
            <div className={_cs(className, styles.dashboard)}>
                <Message className={styles.message}>
                    <Icon
                        className={styles.icon}
                        name="dashboard"
                    />
                    Dashboard goes here
                </Message>
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
