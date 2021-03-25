import React, { useEffect, useState } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import { List, ListItem, ListItemText } from '@material-ui/core';
import { parseCsvItemsArray } from '../../actions/item.actions';
import { LineStyleTwoTone } from '@material-ui/icons';
import MaterialTable from 'material-table';
import { tableIcons } from '../MaterialTableIcons';
import LineStyleIcon from '@material-ui/icons/LineStyle';
import ErrorCard from "./ErrorCard"
import { useSelector } from 'react-redux';
import { RootState } from '../../reducers/rootReducer';
import { toast } from 'react-toastify';
import useAxios from 'axios-hooks';
import Modal, { ModalProps } from '../Modal';
import { Product } from '../../reducers/product.reducer';
import { APIResponse } from '../Axios';
import { CSVReader } from 'react-papaparse';
import { useProductCategoryActions } from '../../actions/auth.actions';

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        dropZone: {
            height: "auto",
            //margin: theme.spacing(2)
        },
        root: {
            display: "flex",
            alignContent: "stretch",
            justifyContent: "center",
            flexFlow: "column wrap",
            "&>*": {
                margin: theme.spacing(1)
            }
        }
    }),
);

export default function ImportModal(props: ModalProps) {
    const classes = useStyles();
    const [data, setData] = useState<Product[]>([]);
    const productCategory = useSelector((state: RootState) => state.product.productCategory);
    const { fetchCategories } = useProductCategoryActions();
    const [{ loading, data: responseData, error }, submitData, cancel] = useAxios<
        APIResponse<null>
    >({
        url: `/product/${productCategory?._id}/import`,
        data: { items: data },
        method: "POST"
    }, { manual: true })

    useEffect(() => {
        if (responseData) {
            toast.success(responseData.message);
            fetchCategories();
            if (props.onClose) props.onClose();
        }
        return () => {
            setData([]);
            cancel();
        }
    }, [responseData])

    const handleClose = () => {
        setData([]);
        cancel();
        props.onClose && props.onClose();
    }

    return (
        <Modal visible={props.visible} onClose={handleClose} title="Import Product from CSV">
            <div className={classes.root}>
                <div className={classes.dropZone}>
                    <CSVReader
                        onError={(err) => toast.error(err.message)}
                        onRemoveFile={() => setData([])}
                        addRemoveButton
                        config={{
                            dynamicTyping: true,
                            skipEmptyLines: true,
                            complete: (results: any) => {
                                try {
                                    if (results.errors.length > 0) {
                                        results.errors.forEach((error: any) => toast.error(error.message))
                                    }
                                    if (results.data.length)
                                        setData(parseCsvItemsArray(results.data) as unknown as Product[]);
                                } catch (error) {
                                    toast.error(error.message ?? error);
                                }
                            }
                        }}
                    >
                        <span>Drop CSV file here or click to upload.</span>
                    </CSVReader>
                </div>
                {error
                    ? <ErrorCard title="Error" errors={error} />
                    : <MaterialTable
                        icons={tableIcons}
                        columns={[
                            { title: "Item Name", field: "name", editable: "never" },
                            { title: "Code", field: "code", editable: "never" },
                            { title: "Rate", field: "rate", type: "numeric", editable: "never" },
                            { title: "MRP", field: "mrp", type: "numeric", editable: "never" },
                        ]}
                        data={data}
                        isLoading={loading}
                        detailPanel={[{
                            icon: LineStyleIcon,
                            openIcon: LineStyleTwoTone,
                            tooltip: 'Show Units',
                            render: (rowData: { units?: any[] }) => {
                                return (rowData.units && rowData.units.length) ? (
                                    <List dense>
                                        {rowData.units.map((unit: { name: string; rate: number; mrp: number; }, key) =>
                                            <ListItem key={key}>
                                                <ListItemText
                                                    primary={unit.name.toUpperCase()}
                                                    secondary={`MRP:₹${unit.mrp} RATE:₹${unit.rate}`}
                                                />
                                            </ListItem>,
                                        )}
                                    </List>
                                ) : <></>
                            }
                        }]}
                    />
                }
                <Button color="primary" variant="contained" disabled={!data.length || loading} onClick={() => submitData()}>Submit</Button>
            </div>
        </Modal>
    );
}
