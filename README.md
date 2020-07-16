# POSM replay tool

Replay changes to OSM

# Getting started

### Setting up configuration

```bash
# Create an environment file
touch .env
```

The environment file should define these variables:

```sh
REACT_APP_API_SERVER_URL=http://localhost:6007/api/v1
REACT_APP_OSM_URL=http://localhost:6007/login/openstreetmap
REACT_APP_MAPBOX_ACCESS_TOKEN="<your-access-token>"
REACT_APP_OSM_LAYER_URL="<url for local osm layer (this is optional)>"
```

### Running locally

```
# Get dependencies
mkdir ./src/vendor
git clone https://github.com/toggle-corp/react-store ./src/vendor
git clone https://github.com/toggle-corp/re-map ./src/vendor

# Start dev server
yarn install
yarn start
```

You will also need to run [posm-replay-server](https://github.com/posm/posm-replay-server).

# Building

```bash
yarn build
```
