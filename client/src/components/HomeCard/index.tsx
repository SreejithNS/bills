import React from 'react';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import { createStyles, makeStyles, Theme } from '@material-ui/core';

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
    content: {
        display: "flex",
        flexFlow: "row nowrap",
        alignItems: "center",
        justifyContent: "flex-start",
        "&>*": {
            display: "inline-block"
        },
        "&>*:first-child": {
            marginRight: theme.spacing(2)
        },
        flexGrow: 1,
    }
}))

export default function HomeCard(props: { classes?: any; onClick: any; title?: any; content?: any; icon?: any; }) {
    const classes = useStyles();
    return (
        <Card className={props.classes || ""} style={{ height: "100%" }}>
            <CardActionArea onClick={props.onClick} style={{ height: "100%" }}>
                <CardContent className={classes.content}>
                    {props.icon &&
                        <div>
                            {props.icon}
                        </div>
                    }
                    <div>
                        <Typography gutterBottom variant="h5" component="h2">
                            {props.title || ""}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" component="p">
                            {props.content || ""}
                        </Typography>
                    </div>
                </CardContent>
            </CardActionArea>
        </Card>
    );
}
