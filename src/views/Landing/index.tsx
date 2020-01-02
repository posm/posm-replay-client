import React from 'react';
import { navigate } from '@reach/router';

import {
    createConnectedRequestCoordinator,
    createRequestClient,
    methods,
    NewProps,
    ClientAttributes,
} from '#request';

interface OwnProps {
}
interface State {
}
interface Params {
}

const requestOptions: { [key: string]: ClientAttributes<OwnProps, Params> } = {
    postOauthToken: {
        url: '/replay-tool/',
        method: methods.POST,
        body: ({ params }) => params,
        onMount: false,
        onSuccess: () => {
            navigate('http://replay-tool.posm.io:3050/');
        },
        onFailure: () => {
            navigate('http://replay-tool.posm.io:3050/');
        },
    },
};

type Props = NewProps<OwnProps, Params>;

class Landing extends React.PureComponent<Props, State> {
    public componentDidMount() {
        const { requests: { postOauthToken } } = this.props;
        const url = new URL(window.location.href);
        const authToken = url.searchParams.get('oauth_token');

        postOauthToken.do({
            'oauth-token': authToken,
        });
    }

    public render() {
        return null;
    }
}

export default createConnectedRequestCoordinator<OwnProps>()(
    createRequestClient(requestOptions)(Landing),
);
