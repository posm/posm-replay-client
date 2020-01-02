import osmAuth from 'osm-auth';

const auth = osmAuth({
    // eslint-disable-next-line @typescript-eslint/camelcase
    oauth_consumer_key: process.env.REACT_APP_OAUTH_CONSUMER_KEY,
    // eslint-disable-next-line @typescript-eslint/camelcase
    oauth_secret: process.env.REACT_APP_OAUTH_SECRET,
    url: process.env.REACT_APP_OAUTH_URL,
    landing: 'http://replay-tool.posm.io:3050/landing/',
    auto: true,
    singlepage: true,
});

export function authenticate() {
    if (!auth.authenticated()) {
        auth.authenticate();
    }
}

export function logout() {
    if (auth.authenticated()) {
        auth.logout();
    }
}
