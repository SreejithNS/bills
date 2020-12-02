import React from 'react';
import { Theme, createStyles, makeStyles } from '@material-ui/core/styles';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import PaymentListItem from "./PaymentListItem";

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

export default function PaymentsList(props: { payments: any[]; }) {
    const classes = useStyles();

    return (
        <Accordion>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="payment_history"
            >
                <Typography className={classes.heading}>
                    Payments History
          </Typography>
            </AccordionSummary>
            <AccordionDetails classes={{ root: classes.root }}>
                <PaymentListItem payments={props.payments} />
            </AccordionDetails>
        </Accordion>
    );
}