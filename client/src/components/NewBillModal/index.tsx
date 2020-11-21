import React, { useState } from 'react';
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
import { Container } from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import NewBillForm from '../NewBillForm';

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
        }
    }),
);

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & { children?: React.ReactElement },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export default function NewBillModal() {
    const [open, setOpen] = useState(true)
    const classes = useStyles();
    const history = useHistory();

    return (
        <Dialog fullScreen open={open} onClose={() => { setOpen(false); history.goBack() }} TransitionComponent={Transition}>
            <AppBar className={classes.appBar}>
                <Toolbar>
                    <IconButton edge="start" color="inherit" onClick={() => { setOpen(false); history.goBack() }} aria-label="close">
                        <CloseIcon />
                    </IconButton>
                    <Typography variant="h6" className={classes.title}>
                        New Bill
                    </Typography>
                    <Button autoFocus color="inherit" onClick={() => { setOpen(false); history.goBack() }}>
                        Cancel
                    </Button>
                </Toolbar>
            </AppBar>
            <Container fixed className={classes.containerPadding}>
                <NewBillForm />
            </Container>
        </Dialog>
    );
}
