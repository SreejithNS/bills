import React from 'react';
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
import NewCustomerForm from "../NewCustomerForm";
import { useHistory } from 'react-router-dom';

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

export default function NewCustomerCreationModal() {
    const classes = useStyles();
    const history = useHistory();
    const handleClose = () => {
        console.log("modal close");
    };
    return (
        <Dialog fullScreen open={true} onClose={history.goBack} TransitionComponent={Transition}>
            <AppBar className={classes.appBar}>
                <Toolbar>
                    <IconButton edge="start" color="inherit" onClick={history.goBack} aria-label="close">
                        <CloseIcon />
                    </IconButton>
                    <Typography variant="h6" className={classes.title}>
                        Create New Customer
                        </Typography>
                    <Button autoFocus color="inherit" onClick={handleClose}>
                        Cancel
                         </Button>
                </Toolbar>
            </AppBar>
            <Container fixed className={classes.containerPadding}>
                <NewCustomerForm onSubmit={(value) => alert(JSON.stringify(value))} />
            </Container>
        </Dialog>
    );
}