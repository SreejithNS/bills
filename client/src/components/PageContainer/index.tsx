import React from "react";
import { makeStyles, createStyles, Container, Theme } from "@material-ui/core";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        container: {
            padding: theme.spacing(2),
            "&>*:last-child": {
                marginBottom: "120px"
            }
        }
    }),
);


export default function PageContainer(props: any) {
    const classes = useStyles();
    return (
        <Container fixed className={classes.container}>
            {props.children}
        </Container>
    )
}