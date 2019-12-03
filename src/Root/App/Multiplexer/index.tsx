import Loadable from 'react-loadable';
import React from 'react';
import { Router } from '@reach/router';
import { _cs } from '@togglecorp/fujs';

import DangerButton from '#rsca/Button/DangerButton';

import Navbar from '#components/Navbar';
import errorBound from '#components/errorBound';
import helmetify from '#components/helmetify';

import LoadingAnimation from '#rscv/LoadingAnimation';
import Message from '#rscv/Message';

import { routeSettings } from '#constants';
import styles from './styles.scss';

interface LoadOptions {
    error: string;
    retry: () => void;
}

function reloadPage(): void {
    window.location.reload(false);
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const BaseErrorInPage = ({
    onReload = reloadPage,
    message = 'Some problem occured',
    className,
}: {
    className?: string;
    message?: string;
    onReload?: () => void;
}) => (
    <Message className={_cs(className, styles.pageError)}>
        <div className={styles.message}>
            { message }
        </div>
        <DangerButton
            className={styles.reloadButton}
            transparent
            onClick={onReload}
        >
            Reload
        </DangerButton>
    </Message>
);

const ErrorInPage = () => (
    <BaseErrorInPage />
);

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const RetryableErrorInPage = ({ error, retry }: LoadOptions) => {
    console.error(error);

    return (
        <BaseErrorInPage
            onReload={retry}
        />
    );
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const LoadingPage = ({ error, retry }: LoadOptions) => {
    if (error) {
        return (
            <RetryableErrorInPage
                error={error}
                retry={retry}
            />
        );
    }

    return (
        <LoadingAnimation message="Loading page" />
    );
};

const routes = routeSettings.map(({ load, ...settings }) => {
    type PageType = typeof settings & { className?: string };
    const Component = errorBound<PageType>(ErrorInPage)(
        helmetify(
            Loadable({
                loader: load,
                loading: LoadingPage,
            }),
        ),
    );

    return (
        <Component
            key={settings.name}
            className={styles.content}
            {...settings}
        />
    );
});

interface State {
}
interface Props {
    pending: boolean;
    className?: string;
}

class Multiplexer extends React.PureComponent<Props, State> {
    public render() {
        const {
            className,
            pending,
        } = this.props;

        return (
            <div className={_cs(styles.multiplexer, className, 'multiplexer')}>
                <Navbar className={styles.navbar} />
                {pending ? (
                    <div className={styles.loadingAnimationContainer}>
                        <LoadingAnimation message="Loading resources" />
                    </div>
                ) : (
                    <Router className={styles.router}>
                        {routes}
                    </Router>
                )}
            </div>
        );
    }
}

export default Multiplexer;
