import React from 'react';
import { authenticate } from '#utils/oauth';

import PrimaryButton from '#rsca/Button/PrimaryButton';

interface Props {
}

interface State {
}

class Login extends React.PureComponent<Props, State> {
    private static handleClick() {
        authenticate();
    }

    public render() {
        return (
            <PrimaryButton
                onClick={Login.handleClick}
            >
                Login
            </PrimaryButton>
        );
    }
}

export default Login;
