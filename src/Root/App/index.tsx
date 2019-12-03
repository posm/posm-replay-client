import React from 'react';

import Multiplexer from './Multiplexer';

interface State {}
interface Params {}
interface Props {}

/* Loads required info from server */
// eslint-disable-next-line react/prefer-stateless-function
class App extends React.Component<Props, State> {
    public render() {
        const pending = false;

        return (
            <Multiplexer
                pending={pending}
            />
        );
    }
}

export default App;
