import React from 'react';
import { Store } from 'redux';
import { Provider } from 'react-redux';
import { persistStore } from 'redux-persist';
import { initializeStyles } from '#rsu/styles';

import store from '#store';
import { addIcon } from '#rscg/Icon';
import { AppState } from '#store/types';
import styleProperties from '#constants/styleProperties';

import {
    iconNames,
} from '#constants';
import App from './App';

interface State {
    rehydrated: boolean;
}
interface Props {
}

Object.keys(iconNames).forEach((key) => {
    addIcon('font', key, iconNames[key]);
});

/* Loads redux into memory */
/* Create redux context */
export default class Root extends React.Component<Props, State> {
    private store: Store<AppState>;

    public constructor(props: Props) {
        super(props);

        this.state = { rehydrated: false };
        // FIXME: later
        this.store = store as Store<AppState>;

        initializeStyles(styleProperties);

        console.info('React version:', React.version);
    }

    public componentDidMount() {
        // NOTE: We can also use PersistGate instead of callback to wait for rehydration
        persistStore(this.store, undefined, this.setRehydrated);
    }

    private setRehydrated = () => {
        this.setState({ rehydrated: true });
    }

    public render() {
        const { rehydrated } = this.state;

        if (!rehydrated) {
            // NOTE: showing empty div, this lasts for a fraction of a second
            return <div />;
        }

        return (
            <Provider store={this.store}>
                <App />
            </Provider>
        );
    }
}
