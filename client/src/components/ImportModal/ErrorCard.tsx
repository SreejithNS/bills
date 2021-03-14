import React from 'react';
import { makeStyles, Theme } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';

const useStyles = makeStyles((theme: Theme) => ({
    root: {
        minWidth: 275,
        background: theme.palette.error.main,
        color: theme.palette.error.contrastText
    }
}))

export default function ErrorCard(props: { title: React.ReactNode | string; errors: { toString: () => React.ReactNode; } | any | any[]; }) {
    const classes = useStyles();

    return (
        <Card className={classes.root}>
            <CardContent>
                <Typography variant="h5" display="inline" component="h2">
                    <ErrorOutlineIcon fontSize="small" /> {props.title}
                </Typography>
                <Typography color="textSecondary">
                    {props.errors.toString()}
                </Typography>
            </CardContent>
        </Card>
    );
}
