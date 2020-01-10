import {
    createRequestCoordinator,
    methods,
    CoordinatorAttributes,
} from '@togglecorp/react-rest-request';

import schema from '#schema';
import { sanitizeResponse } from '#utils/common';

const wsEndpoint = process.env.REACT_APP_API_SERVER_URL;

const disableSchemaError = true;

export const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);

    if (parts.length === 2) {
        const part = parts.pop();
        return part && part.split(';').shift();
    }
    return undefined;
};

interface Error {
    errors?: {
        nonFieldErrors?: string[];
        internalNonFieldErrors?: string[];
        [key: string]: string[] | undefined;
    };
}

export function createConnectedRequestCoordinator<OwnProps>() {
    type Props = OwnProps;

    const requestor = createRequestCoordinator({
        transformParams: (data: CoordinatorAttributes) => {
            const {
                body,
                method,
            } = data;

            const csrftoken = getCookie('csrftoken');
            return {
                method: method || methods.GET,
                body: JSON.stringify(body),
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json; charset=utf-8',
                    'X-CSRFToken': csrftoken,
                },
                credentials: 'include',
            };
        },
        // NOTE: we can inject props here
        transformProps: (props: Props) => props,

        transformUrl: (url: string) => {
            if (/^https?:\/\//i.test(url)) {
                return url;
            }

            return `${wsEndpoint}${url}`;
        },

        transformResponse: (body: object, request: CoordinatorAttributes) => {
            const {
                url,
                method,
                extras: requestOptions,
            } = request;
            const sanitizedResponse = sanitizeResponse(body);

            const extras = requestOptions as { schemaName?: string };
            if (!extras || extras.schemaName === undefined) {
                // NOTE: usually there is no response body for DELETE
                if (method !== methods.DELETE && !disableSchemaError) {
                    console.error(`Schema is not defined for ${url} ${method}`);
                }
            } else {
                try {
                    schema.validate(sanitizedResponse, extras.schemaName);
                } catch (e) {
                    console.error(url, method, sanitizedResponse, e.message);
                    throw (e);
                }
            }

            return sanitizedResponse;
        },

        transformErrors: (response: Error) => {
            // eslint-disable-next-line @typescript-eslint/camelcase
            const { non_field_errors, ...faramErrors } = response.errors || {};
            // eslint-disable-next-line @typescript-eslint/camelcase
            const nonFieldErrors = non_field_errors ? non_field_errors.join(' ') : undefined;

            return {
                response,
                faramErrors,
                nonFieldErrors,
            };
        },
    });

    return requestor;
}

export * from '@togglecorp/react-rest-request';
