import React, { useState } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import svg from "../../assets/404error.svg";
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import Slide from '@material-ui/core/Slide';
import { TransitionProps } from '@material-ui/core/transitions';
import { Container, Grid, Typography } from '@material-ui/core';
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
            // padding: theme.spacing(2),
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
    return (
        <Dialog fullScreen open={"visible" in props ? props.visible : open} onClose={props.onClose || (() => { setOpen(false); history.goBack() })} TransitionComponent={Transition}>
            <Container fixed className={classes.container}>
                <Grid
                    container
                    direction="row"
                    justify="center"
                    alignItems="center"
                    style={{ height: "100%" }}
                >
                    <Grid item xs style={{ textAlign: "center" }}>
                        <img src={svg} alt="Page Not Found" style={{ width: "100%" }} />
                        <Typography variant="h4" display="block" style={{ marginBottom: "1em" }} >
                            Oops! you are not supposed to be here.
                        </Typography>
                        <Button variant="outlined" onClick={() => history.push(paths.home)}>Take back to Home Page</Button>
                    </Grid>
                </Grid>
            </Container>
        </Dialog>
    );
}
