import React from "react";
import { createStyles, Theme, makeStyles } from "@material-ui/core/styles";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import Avatar from "@material-ui/core/Avatar";
import AccountCircleRoundedIcon from '@material-ui/icons/AccountCircleRounded';
import { IconButton, ListItemSecondaryAction } from "@material-ui/core";
import { DeleteForeverRounded, Edit } from "@material-ui/icons";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            width: "100%",
            backgroundColor: theme.palette.background.paper,
            border: "1px solid black",
            borderColor: theme.palette.grey[300],
            borderRadius: theme.shape.borderRadius
        }
    })
);

export default function SalesmenList(props: { firstName: string; phoneNumber: number; onEdit(): void; onDelete(): void }) {
    const classes = useStyles();

    return (
        <List disablePadding className={classes.root}>
            <ListItem>
                <ListItemAvatar>
                    <Avatar>
                        <AccountCircleRoundedIcon />
                    </Avatar>
                </ListItemAvatar>
                <ListItemText primary={props.firstName} secondary={props.phoneNumber} />
                <ListItemSecondaryAction>
                    <IconButton onClick={props.onEdit} aria-label="edit-password">
                        <Edit />
                    </IconButton>
                    <IconButton onClick={props.onDelete} edge="end" aria-label="edit-password">
                        <DeleteForeverRounded />
                    </IconButton>
                </ListItemSecondaryAction>
            </ListItem>

        </List>
    );
}
