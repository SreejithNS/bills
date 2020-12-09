import React from "react";
import { makeStyles, createStyles, Container, Theme } from "@material-ui/core";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        containerTop: {
            padding: theme.spacing(2)
        }
    }),
);


export default function PageContainer(props: any) {
    const classes = useStyles();
    return (
        <Container fixed className={classes.containerTop}>
            {props.children}
        </Container>
    )
}