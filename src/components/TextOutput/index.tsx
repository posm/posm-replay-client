import React from 'react';
import { _cs } from '@togglecorp/fujs';

import styles from './styles.scss';

interface Props {
    className?: string;
    label: string;
    value: React.ReactNode;
    labelClassName?: string;
    valueClassName?: string;
    // valueType: 'string|number|date';
}

class TextOutput extends React.PureComponent<Props> {
    public render() {
        const {
            className,
            label,
            value,
            labelClassName,
            valueClassName,
        } = this.props;

        return (
            <div className={_cs(styles.textOutput, className)}>
                <div className={_cs(styles.label, labelClassName)}>
                    { label }
                </div>
                <div className={_cs(styles.value, valueClassName)}>
                    { value }
                </div>
            </div>
        );
    }
}

export default TextOutput;
