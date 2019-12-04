import React from 'react';
import { _cs } from '@togglecorp/fujs';

import ListView from '#rscv/List/ListView';
import POSMIcon from '#resources/posm.png';

import { routeSettings, hasNavbar, NavbarRoute } from '#constants';

import MenuItem from './MenuItem';

import styles from './styles.scss';

const pages = routeSettings.filter(hasNavbar);

interface Props {
    className?: string;
}

class Navbar extends React.PureComponent<Props> {
    private static menuKeySelector = (data: NavbarRoute) => data.name;

    private menuRendererParams = (key: string, data: NavbarRoute) => ({
        title: data.title,
        link: data.path,
        disabled: data.disabled,
    });

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
                <div
                    className={styles.brand}
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
                </div>
                <ListView
                    data={pages}
                    keySelector={Navbar.menuKeySelector}
                    renderer={MenuItem}
                    rendererParams={this.menuRendererParams}
                    className={styles.menu}
                />
            </nav>
        );
    }
}

export default Navbar;
