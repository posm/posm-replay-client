import React, { useState, useCallback, useContext } from 'react';
import {
    _cs,
    isFalsyString,
} from '@togglecorp/fujs';

import DropdownMenu from '#rsca/DropdownMenu';
import Modal from '#rscv/Modal';
import ModalHeader from '#rscv/Modal/Header';
import ModalBody from '#rscv/Modal/Body';
import ModalFooter from '#rscv/Modal/Footer';
import TextInput from '#rsci/TextInput';
import MapStyleContext from '#components/LayerContext';
import Button from '#rsu/../v2/Action/Button';

import styles from './styles.scss';

export interface MapStyle {
    name: string;
    data: mapboxgl.MapboxOptions['style'];
}

interface Props {
    className?: string;
    selected: string;
    onSelectedLayerChange: (selected: string) => void;
}

const styleLabelSelector = (item: MapStyle) => item.name;
const styleKeySelector = (item: MapStyle) => item.name;

function LayerSwitcher(props: Props) {
    const {
        className,
        selected,
        onSelectedLayerChange,
    } = props;

    const [addStyleVisibility, setAddStyleVisibility] = useState(false);
    const [layerUrl, setLayerUrl] = useState('');
    const [layerName, setLayerName] = useState('');

    const {
        mapStyles,
        setMapStyle,
    } = useContext(MapStyleContext);

    const handleLayerAdd = useCallback(() => {
        setMapStyle({
            name: layerName,
            data: {
                version: 8,
                name: layerName,
                sources: {
                    base: {
                        type: 'raster',
                        tiles: [layerUrl],
                        tileSize: 256,
                    },
                },
                layers: [
                    {
                        id: 'background',
                        type: 'background',
                        paint: { 'background-color': 'rgb(239, 239, 239)' },
                    },
                    {
                        id: 'base',
                        type: 'raster',
                        source: 'base',
                    },
                ],
            },
        });
        setLayerName('');
        setLayerUrl('');
        setAddStyleVisibility(false);
    }, [
        layerName,
        layerUrl,
        setMapStyle,
        setAddStyleVisibility,
        setLayerName,
        setLayerUrl,
    ]);

    const handleAddModalShow = useCallback(() => {
        setAddStyleVisibility(true);
    }, [setAddStyleVisibility]);

    const handleAddModalClose = useCallback(() => {
        setAddStyleVisibility(false);
    }, [setAddStyleVisibility]);

    return (
        <>
            <DropdownMenu
                className={_cs(styles.layerSwitcher, className)}
                dropdownIconClassName={styles.icon}
                dropdownClassName={styles.container}
                dropdownIcon="layers"
                closeOnClick
            >
                {mapStyles.map(mapStyleItem => (
                    <Button
                        key={styleKeySelector(mapStyleItem)}
                        className={_cs(
                            styles.layerButton,
                            selected === styleKeySelector(mapStyleItem)
                            && styles.active,
                        )}
                        onClick={() => onSelectedLayerChange(
                            styleKeySelector(mapStyleItem),
                        )}
                    >
                        {styleLabelSelector(mapStyleItem)}
                    </Button>
                ))}
                <Button
                    className={styles.layerButton}
                    onClick={handleAddModalShow}
                >
                    Add New Layer
                </Button>
            </DropdownMenu>
            {addStyleVisibility && (
                <Modal>
                    <ModalHeader title="Add Map Style" />
                    <ModalBody>
                        <TextInput
                            label="Layer Name"
                            value={layerName}
                            onChange={setLayerName}
                        />
                        <TextInput
                            label="Layer URL"
                            value={layerUrl}
                            onChange={setLayerUrl}
                            hint="http://tile.stamen.com/watercolor/{z}/{x}/{y}.jpg"
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            onClick={handleAddModalClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleLayerAdd}
                            disabled={isFalsyString(layerUrl) || isFalsyString(layerName)}
                        >
                            Add
                        </Button>
                    </ModalFooter>
                </Modal>
            )}
        </>
    );
}

export default LayerSwitcher;
