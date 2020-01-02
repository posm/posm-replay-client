import React from 'react';
import { navigate } from '@reach/router';
import { getAccessToken } from '#utils/oauth';

import {
    createConnectedRequestCoordinator,
    createRequestClient,
    methods,
    NewProps,
    ClientAttributes,
} from '#request';

interface OwnProps {
    successUrl: string;
}
interface State {
}
interface Params {
}

const requestOptions: { [key: string]: ClientAttributes<OwnProps, Params> } = {
    postOauthToken: {
        url: '/push-upstream/',
        method: methods.POST,
        body: ({ params }) => params,
        onMount: false,
        onSuccess: ({ props }) => {
            const { successUrl } = props;
            if (successUrl) {
                navigate(successUrl);
            } else {
                navigate('http://replay-tool.posm.io:3050/');
            }
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
        const oauthToken = url.searchParams.get('oauth_token');
        if (oauthToken) {
            getAccessToken(oauthToken, (error: string, _: unknown) => {
                if (error) console.warn('error', error);

                const baseUrl = process.env.REACT_APP_OAUTH_URL;
                const accessToken = localStorage.getItem(`${baseUrl}oauth_token`);
                const accessTokenSecret = localStorage.getItem(`${baseUrl}oauth_token_secret`);
                if (accessToken && accessTokenSecret) {
                    postOauthToken.do({
                        // eslint-disable-next-line @typescript-eslint/camelcase
                        oauth_token: JSON.parse(accessToken),
                        // eslint-disable-next-line @typescript-eslint/camelcase
                        oauth_token_secret: JSON.parse(accessTokenSecret),
                    });
                }
            });
        }
    }

    public render() {
        return null;
    }
}

export default createConnectedRequestCoordinator<OwnProps>()(
    createRequestClient(requestOptions)(Landing),
);
