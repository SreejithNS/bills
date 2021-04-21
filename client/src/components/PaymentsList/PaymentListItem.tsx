import React from "react";
import { createStyles, Theme, makeStyles } from "@material-ui/core/styles";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import Avatar from "@material-ui/core/Avatar";
import AddCircleOutlineRoundedIcon from "@material-ui/icons/AddCircleOutlineRounded";
import moment from "moment";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            width: "100%",
            backgroundColor: theme.palette.background.paper
        }
    })
);

export default function PaymentListItem(props: { payments: any[] }) {
    const classes = useStyles();

    return (
        <List dense={true} className={classes.root}>
            {props.payments?.length &&
                props.payments.map(
                    (
                        { paidAmount, paymentReceivedBy, updatedAt }: any,
                        key: string | number | undefined
                    ) => (
                        <ListItem key={key}>
                            <ListItemAvatar>
                                <Avatar>
                                    <AddCircleOutlineRoundedIcon />
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={`₹${paidAmount}`}
                                secondary={`${"Received by " + paymentReceivedBy?.name.toLocaleUpperCase()} at ${moment(updatedAt.toString()).format('MMM D YYYY, h:mm a')}`}
                            />
                        </ListItem>
                    )
                )}
        </List>
    );
}
