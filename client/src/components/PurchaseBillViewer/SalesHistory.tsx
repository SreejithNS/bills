import React from 'react';
import { Theme, createStyles, makeStyles } from '@material-ui/core/styles';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import Avatar from "@material-ui/core/Avatar";
import AddCircleOutlineRoundedIcon from "@material-ui/icons/AddCircleOutlineRounded";
import moment from "moment";
import { ListItemSecondaryAction, IconButton } from "@material-ui/core";
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import { useHasPermission } from "../../actions/auth.actions";
import { UserPermissions } from "../../reducers/auth.reducer";
import { BillData } from '../../reducers/bill.reducer';
import DeleteOutlineRounded from '@material-ui/icons/DeleteOutlineRounded';

const useStylesForListItem = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            width: "100%",
            backgroundColor: theme.palette.background.paper
        }
    })
);

function SalesHistoryListItem(props: { sales: any[]; onOpen?: (_id: string) => void; onDelete?: (_id: string) => void }) {
    const classes = useStylesForListItem();
    const billGetPermission = useHasPermission(UserPermissions.ALLOW_BILL_GET);
    const billPutPermission = useHasPermission(UserPermissions.ALLOW_BILL_PUT);

    return (
        <List dense={true} className={classes.root}>
            {props.sales?.length &&
                props.sales.map(
                    (
                        { bill, items, _id }: { bill: Pick<BillData, "_id" | "createdAt" | "serialNumber"> | null; items: { code: string; quantity: number; amount: number; }[]; _id: string },
                        key: string | number | undefined
                    ) => (
                        <ListItem key={key}>
                            {(billGetPermission && props.onOpen && bill) ? <ListItemAvatar>
                                <Avatar>
                                    <IconButton aria-label="open" onClick={() => props.onOpen && props.onOpen(bill._id)}>
                                        <OpenInNewIcon />
                                    </IconButton>
                                </Avatar>
                            </ListItemAvatar> : <ListItemAvatar>
                                <Avatar>
                                    <AddCircleOutlineRoundedIcon />
                                </Avatar>
                            </ListItemAvatar>}
                            <ListItemText
                                primary={bill ? "#" + bill.serialNumber : 'Deleted Bill'}
                                secondary={<>
                                    {bill ? moment(bill.createdAt.toString()).format('MMM D YYYY, h:mm a') : ""}
                                    <br />
                                    {items.map(({ code, quantity, amount }) => (
                                        <div><strong>{code} <em>x{quantity}</em> = {amount.toFixed(2)}</strong></div>
                                    ))}
                                </>}
                            />
                            {(billPutPermission && props.onDelete) && <ListItemSecondaryAction>
                                <IconButton edge="end" aria-label="delete" onClick={() => props.onDelete && props.onDelete(_id)}>
                                    <DeleteOutlineRounded />
                                </IconButton>
                            </ListItemSecondaryAction>}
                        </ListItem>
                    )
                )}
        </List>
    );
}

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            padding: '0',
        },
        heading: {
            fontSize: theme.typography.pxToRem(15),
            fontWeight: theme.typography.fontWeightRegular,
        },
    }),
);

export default function SalesHistory(props: { sales: any[]; onOpen?(_id: string): void; onDelete(_id: string): void }) {
    const classes = useStyles();

    return (
        <Accordion>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
            >
                <Typography className={classes.heading}>
                    Sales History
                </Typography>
            </AccordionSummary>
            <AccordionDetails classes={{ root: classes.root }}>
                <SalesHistoryListItem sales={props.sales} onOpen={props.onOpen} onDelete={props.onDelete} />
            </AccordionDetails>
        </Accordion>
    );
}