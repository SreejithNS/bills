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

export type ModalProps = {
    onClose?: () => void;
    visible?: boolean;
}

interface PropTypes extends ModalProps {
    title: string;
    closeText?: string;
    onClose?: () => void;
    extraButtons?: {
        text: string;
        onClick: () => void;
    }[];
    children: any;
}

export default function Modal(props: PropTypes) {
    const [open, setOpen] = useState(true);
    const classes = useStyles();
    const history = useHistory();

    const handleClose = (() => {
        setOpen(false);
        if (props.onClose) props.onClose();
        else {
            history.goBack();
        }
    });
    return (
        <Dialog fullScreen open={props.visible ?? open} onClose={handleClose} TransitionComponent={Transition}>
            <AppBar className={classes.appBar}>
                <Toolbar>
                    <IconButton edge="start" color="inherit" onClick={handleClose} aria-label="close">
                        <CloseIcon />
                    </IconButton>
                    <Typography variant="h6" className={classes.title}>
                        {props.title}
                    </Typography>
                    <Button autoFocus color="inherit" onClick={handleClose}>
                        {props.closeText ?? "Close"}
                    </Button>
                    {props.extraButtons && props.extraButtons.map((buttonDetails, key) =>
                        <Button key={key} color="inherit" onClick={buttonDetails.onClick}>
                            {buttonDetails.text}
                        </Button>
                    )}
                </Toolbar>
            </AppBar>
            <Container fixed className={classes.containerPadding}>
                {props.children}
            </Container>
        </Dialog>
    );
}
