import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import { Grid } from "@material-ui/core";


const useStyles = makeStyles((theme) => ({
    root: {
        minWidth: theme.breakpoints.width("xs")
    },
    content: {
        "&:last-child": {
            paddingBottom: theme.spacing(2)
        }
    }
}));

interface Props {
    icon: React.ReactNode;
    heading: string;
    content?: string | React.ReactNode;
}

export default function ParagraphIconCard(props: Props) {
    const classes = useStyles();
    return (
        <Card className={classes.root} variant="outlined">
            <CardContent className={classes.content}>
                <Grid container direction="row" justify="center" alignItems="center">
                    <Grid item xs style={{ textAlign: "center" }} >
                        {props.icon}
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="h5" align="center">
                            {props.heading}
                        </Typography>
                        {props.content && <Typography variant="subtitle2" align="center">
                            {props.content}
                        </Typography>}
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
}
