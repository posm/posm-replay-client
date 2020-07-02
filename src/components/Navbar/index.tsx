import React from 'react';
import { _cs } from '@togglecorp/fujs';
import { MdSettings } from 'react-icons/md';

import { Link } from '@reach/router';
import POSMIcon from '#resources/posm.png';

import styles from './styles.scss';

interface Props {
    className?: string;
}

class Navbar extends React.PureComponent<Props> {
    public render() {
        const {
            className: classNameFromProps,
        } = this.props;

        const className = _cs(
            classNameFromProps,
            styles.navbar,
        );

        return (
            <nav className={className}>
                <Link
                    className={_cs(styles.link, styles.brand)}
                    to="/"
                    title={process.env.REACT_APP_VERSION}
                >
                    <img
                        src={POSMIcon}
                        alt="POSM"
                        className={styles.icon}
                    />
                    <div className={styles.label}>
                        replay tool
                    </div>
                </Link>
                <Link
                    className={_cs(styles.link, styles.configurationIcon)}
                    title="Configuration"
                    to="/configuration/"
                >
                    <MdSettings />
                </Link>
            </nav>
        );
    }
}

export default Navbar;
