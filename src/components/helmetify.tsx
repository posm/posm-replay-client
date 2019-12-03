import React from 'react';
import Helmet from 'react-helmet';

interface Props {
    title: string;
}

const helmetify = (WrappedComponent: React.ComponentType<Props>) => (props: Props) => {
    const { title } = props;
    return (
        <React.Fragment>
            <Helmet>
                <meta charSet="utf-8" />
                <title>
                    {title}
                </title>
            </Helmet>
            <WrappedComponent
                {...props}
            />
        </React.Fragment>
    );
};

export default helmetify;
