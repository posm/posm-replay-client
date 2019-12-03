import React from 'react';
import { Link } from '@reach/router';

import { _cs } from '@togglecorp/fujs';

import styles from './styles.scss';

interface Props {
    className?: string;
    title: string;
    link?: string;
    disabled?: boolean;
}

class MenuItem extends React.PureComponent<Props> {
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    private getProps = ({ isCurrent }: { isCurrent: boolean }) => {
        const {
            className,
            disabled,
        } = this.props;

        return {
            className: _cs(
                className,
                styles.menuItem,
                isCurrent && styles.active,
                disabled && styles.disabled,
            ),
        };
    };

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    public render() {
        const {
            disabled,
            className,
            link,
            title,
        } = this.props;

        if (disabled) {
            return (
                <div
                    className={
                        _cs(
                            className,
                            styles.menuItem,
                            // routeKey === link && styles.selected,
                            disabled && styles.disabled,
                        )
                    }
                >
                    <div className={styles.menuTitle}>
                        {title}
                    </div>
                </div>
            );
        }
        return (
            <Link
                to={link}
                getProps={this.getProps}
            >
                <div className={styles.menuTitle}>
                    {title}
                </div>
            </Link>
        );
    }
}

export default MenuItem;
