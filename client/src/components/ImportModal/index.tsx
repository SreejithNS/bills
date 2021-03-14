import React, { useEffect, useState } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';
import Slide from '@material-ui/core/Slide';
import { TransitionProps } from '@material-ui/core/transitions';
import { Container, List, ListItem, ListItemText } from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import { DropzoneArea } from "material-ui-dropzone";
import Papa from "papaparse";
import { parseCsvItemsArray } from '../../actions/item.actions';
import { LineStyleTwoTone } from '@material-ui/icons';
import MaterialTable from 'material-table';
import { tableIcons } from '../MaterialTableIcons';
import LineStyleIcon from '@material-ui/icons/LineStyle';
import ErrorCard from "./ErrorCard"
const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        appBar: {
            position: 'relative',
        },
        title: {
            marginLeft: theme.spacing(2),
            flex: 1,
        },
        containerPadding: {
            padding: theme.spacing(2)
        },
        dropZoneRoot: {
            minHeight: 0
        }
    }),
);

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & { children?: React.ReactElement },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export default function ImportModal(props: { open?: boolean; onClose?: () => void; }) {
    const [open, setOpen] = useState(true)
    const classes = useStyles();
    const history = useHistory();
    const [files, storeFile] = useState<any[]>([]);
    const [error, setError] = useState<any | any[]>(null);
    const [data, setData] = useState<any[]>([]);

    const handleClose = () => { if (props.onClose) return props.onClose(); setOpen(false); history.goBack() }

    useEffect(() => {
        if (files.length) {
            const file = files.shift();
            Papa.parse<any[][]>(file,
                {
                    dynamicTyping: true,
                    skipEmptyLines: true,
                    complete: function (results) {
                        if (results.errors.length) setError(results.errors);
                        setData(parseCsvItemsArray(results.data));
                    }
                }
            )
        }
    }, [files])

    return (
        <Dialog fullScreen open={props.open ?? open} onClose={handleClose} TransitionComponent={Transition} >
            <AppBar className={classes.appBar}>
                <Toolbar>
                    <IconButton edge="start" color="inherit" onClick={handleClose} aria-label="close">
                        <CloseIcon />
                    </IconButton>
                    <Typography variant="h6" className={classes.title}>
                        Import from CSV
                    </Typography>
                    <Button autoFocus color="inherit" onClick={handleClose}>
                        Cancel
                    </Button>
                </Toolbar>
            </AppBar>
            <Container fixed className={classes.containerPadding}>
                {/* <NewBillForm closeModal={() => { setOpen(false); history.goBack() }} /> */}
                <DropzoneArea
                    onChange={(files) => storeFile(files)}
                    showPreviewsInDropzone={false}
                    classes={{
                        root: classes.dropZoneRoot
                    }}
                />
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

            </Container>
        </Dialog >
    );
}
