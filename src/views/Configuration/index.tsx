import React from 'react';
import { _cs } from '@togglecorp/fujs';
import Faram, {
    requiredCondition,
} from '@togglecorp/faram';
import NonFieldErrors from '#rsci/NonFieldErrors';

import PrimaryButton from '#rsca/Button/PrimaryButton';
import TextInput from '#rsci/TextInput';

import {
    createConnectedRequestCoordinator,
    createRequestClient,
    methods,
    NewProps,
    ClientAttributes,
} from '#request';

import styles from './styles.scss';

interface OwnProps {
    className?: string;
}
interface Params{
    setConfiguration?: (faramValues: ConfigurationType) => void;
    body?: unknown;
    onSuccess?: () => void;
    onFailure?: (faramErrors: object) => void;
}
type Props = NewProps<OwnProps, Params>;

interface State {
    faramValues: Partial<ConfigurationType>;
    faramErrors: object;
    pristine: boolean;
}

interface ConfigurationType {
    id: number;

    posmDbHost: string;
    posmDbName: string;
    posmDbUser: string;
    posmDbPassword: string;

    osmBaseUrl: string;
    aoiRoot: string;
    aoiName: string;
    osmosisDbHost: string;
    osmosisAoiRoot: string;
    oauthConsumerKey: string;
    oauthConsumerSecret: string;
    originalAoiFileName: string;
    overpassApiUrl: string;
    oauthApiUrl: string;
    requestTokenUrl: string;
    accessTokenUrl: string;
    authorizationUrl: string;
}

const requestOptions: { [key: string]: ClientAttributes<OwnProps, Params> } = {
    configurationGet: {
        url: '/config/1/',
        method: methods.GET,
        onMount: true,
        onSuccess: ({
            params,
            response,
        }) => {
            if (!params) {
                return;
            }
            const {
                setConfiguration,
            } = params;
            if (setConfiguration) {
                setConfiguration(response as ConfigurationType);
            }
        },
    },
    configurationPutRequest: {
        url: '/config/1/',
        method: methods.PUT,
        body: ({ params }) => params && params.body,
        onSuccess: ({ params }) => {
            if (params && params.onSuccess) {
                params.onSuccess();
            }
        },
        onFailure: ({ params, error }) => {
            if (params && params.onFailure) {
                console.error(error);
                params.onFailure({
                    $internal: ['Some error occurred'],
                });
            }
        },
        onFatal: ({ params }) => {
            if (params && params.onFailure) {
                params.onFailure({
                    $internal: ['Some error occurred'],
                });
            }
        },
    },
};

class Configuration extends React.PureComponent<Props, State> {
    public constructor(props: Props) {
        super(props);
        const {
            requests: {
                configurationGet,
            },
        } = this.props;

        configurationGet.setDefaultParams({
            setConfiguration: this.setConfiguration,
        });

        this.state = {
            faramValues: {},
            faramErrors: {},
            pristine: true,
        };

        this.schema = {
            fields: {
                aoiName: [requiredCondition],
                originalAoiFileName: [requiredCondition],
                oauthConsumerKey: [requiredCondition],
                oauthConsumerSecret: [requiredCondition],
                oauthApiUrl: [requiredCondition],
                requestTokenUrl: [requiredCondition],
                accessTokenUrl: [requiredCondition],
                authorizationUrl: [requiredCondition],
                osmBaseUrl: [],
                posmDbHost: [],
                posmDbName: [],
                posmDbUser: [],
                posmDbPassword: [],
                aoiRoot: [],
                osmosisDbHost: [],
                osmosisAoiRoot: [],
                overpassApiUrl: [],
            },
        };
    }

    private schema: object;

    private setConfiguration = (resposne: ConfigurationType) => {
        this.setState({ faramValues: resposne });
    }

    private handleFaramChange = (faramValues: Partial<ConfigurationType>, faramErrors: object) => {
        this.setState({ faramValues, faramErrors, pristine: false });
    }

    private handleFaramValidationFailure = (faramErrors: object) => {
        this.setState({ faramErrors });
    }

    private handleFaramValidationSuccess = (values: object) => {
        const {
            requests: { configurationPutRequest },
        } = this.props;

        configurationPutRequest.do({
            body: values,
            onSuccess: () => {
                this.setState({
                    pristine: true,
                });
            },
            onFailure: (faramErrors: object) => {
                this.setState({ faramErrors });
            },
        });
    }

    public render() {
        const {
            className,
            requests: {
                configurationGet: {
                    pending: configGetPending,
                    response,
                },
                configurationPutRequest: {
                    pending: configPutPending,
                },

            },
        } = this.props;

        const {
            faramValues,
            faramErrors,
            pristine,
        } = this.state;

        const pending = configGetPending || configPutPending;

        return (
            <div className={styles.configuration}>
                <Faram
                    className={styles.container}
                    onChange={this.handleFaramChange}
                    onValidationFailure={this.handleFaramValidationFailure}
                    onValidationSuccess={this.handleFaramValidationSuccess}
                    schema={this.schema}
                    value={faramValues}
                    error={faramErrors}
                    disabled={pending}
                >
                    <div className={styles.firstPart}>
                        <TextInput
                            faramElementName="aoiName"
                            label="AOI Name"
                            hint="Directory name of AOI which contains manifest.json and other files."
                            placeholder=""
                        />
                        <TextInput
                            faramElementName="originalAoiFileName"
                            label="AOI FileName"
                            hint="File name for original aoi[osm file located inside aoi along with manifest json]"
                            placeholder=""
                        />
                        <TextInput
                            faramElementName="oauthConsumerKey"
                            label="OAuth Consumer Key"
                            placeholder=""
                            hint="OSM OAuth consumer key"
                        />
                        <TextInput
                            faramElementName="oauthConsumerSecret"
                            label="OAuth Consumer Secret"
                            hint="OSM OAuth consumer secret"
                            placeholder=""
                        />
                        <TextInput
                            faramElementName="oauthApiUrl"
                            label="OAuth Api Url"
                            hint="OSM oauth root api endpoint"
                            placeholder=""
                        />
                        <TextInput
                            faramElementName="requestTokenUrl"
                            label="OAuth Request Token Url"
                            hint="OSM OAuth api endpoint for request token"
                            placeholder=""
                        />
                        <TextInput
                            faramElementName="accessTokenUrl"
                            label="OAuth Access Token Url"
                            hint="OSM OAuth api endpoint for access token"
                            placeholder=""
                        />
                        <TextInput
                            faramElementName="authorizationUrl"
                            label="OAuth Authorization Url"
                            hint="OSM OAuth api endpoint for authorization"
                            placeholder=""
                        />
                    </div>
                    <div className={styles.secondPart}>
                        <TextInput
                            faramElementName="osmBaseUrl"
                            label="OSM Base Url"
                            hint="POSM's schema://IP:port that's serving osm."
                            placeholder=""
                        />
                        <TextInput
                            faramElementName="posmDbHost"
                            label="POSM Database Host"
                            hind="POSM's IP which listens to psql connections."
                            placeholder=""
                        />
                        <TextInput
                            faramElementName="posmDbName"
                            label="POSM Database Name"
                            hint="OSM Database Name"
                            placeholder=""
                        />
                        <TextInput
                            faramElementName="posmDbUser"
                            label="POSM Database User"
                            hint="OSM Database User"
                            placeholder=""
                        />
                        <TextInput
                            faramElementName="posmDbPassword"
                            label="POSM Database Password"
                            hint="OSM Database password"
                            placeholder=""
                        />
                        <TextInput
                            faramElementName="aoiRoot"
                            label="AOI Root"
                            hint="Path inside docker mapped with host's /opt/data/aoi"
                            placeholder=""
                        />
                        <TextInput
                            faramElementName="osmosisAoiRoot"
                            label="Osmosis AOI Root"
                            hint="Host AOI root location"
                            placeholder=""
                        />
                        <TextInput
                            faramElementName="osmosisDbHost"
                            label="Osmosis Database Host"
                            hint="IP of POSM itself"
                            placeholder=""
                        />
                        <TextInput
                            faramElementName="overpassApiUrl"
                            label="Overpass Api Url"
                            hint="'Overpass api from where upstream data is pulled"
                            placeholder=""
                        />
                    </div>
                    <NonFieldErrors faramElement />
                    <div className={styles.actions}>
                        <PrimaryButton
                            type="submit"
                            pending={pending}
                            disabled={pristine}
                        >
                            Apply Configuration
                        </PrimaryButton>
                    </div>
                </Faram>
            </div>
        );
    }
}

export default createConnectedRequestCoordinator<OwnProps>()(
    createRequestClient(requestOptions)(Configuration),
);
