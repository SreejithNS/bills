import React, { useState } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import svg from "../../assets/404error.svg";
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import Slide from '@material-ui/core/Slide';
import { TransitionProps } from '@material-ui/core/transitions';
import { Box, Container, Typography, useTheme } from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import { paths } from '../../routes/paths.enum';
// import { useDispatch } from 'react-redux';

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        appBar: {
            position: 'relative',
        },
        title: {
            marginLeft: theme.spacing(2),
            flex: 1,
        },
        container: {
            height: "100%"
        }
    }),
);

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & { children?: React.ReactElement },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export default function NotFoundModal(props: any) {
    const [open, setOpen] = useState(true);
    const classes = useStyles();
    const history = useHistory();
    const theme = useTheme();
    return (
        <Dialog fullScreen open={"visible" in props ? props.visible : open} onClose={props.onClose || (() => { setOpen(false); history.goBack() })} TransitionComponent={Transition}>
            <Container fixed className={classes.container}>
                <Box display="flex" justifyContent="center" alignItems="center" height="100%" textAlign="center">
                    <div>
                        <img src={svg} alt="Page Not Found" style={{ width: "100%", maxWidth: 300 }} />
                        <Typography variant="h4" display="block" style={{ margin: theme.spacing(3), }} >
                            Oops! You are in the wrong section.
                        </Typography>
                        <Button variant="outlined" onClick={() => history.push(paths.home)}>Go to Home Page</Button>
                    </div>
                </Box>
            </Container>
        </Dialog>
    );
}
