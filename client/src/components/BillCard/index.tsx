import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import { CardActionArea, Collapse, Grid, IconButton } from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/Delete";
import QueryBuilderRoundedIcon from '@material-ui/icons/QueryBuilderRounded';
import clsx from "clsx";
import MoreVertIcon from '@material-ui/icons/MoreVert';
import { RoomRounded } from "@material-ui/icons";
import useAxios from "axios-hooks";
import { toast } from "react-toastify";
import { APIResponse, handleAxiosError } from "../Axios";

export interface BillCardProps {
  primaryText?: string;
  secondaryText?: string;
  rightPrimary?: number;
  rightSecondary?: any;
  timestamp?: string;
  location?: [number, number];
  pay?: {
    credit: boolean;
    paidAmount: number;
    id: string;
    billAmount: number;
    refresh: () => void;
  }
  deleteAction(): void;
  onClickAction(): void;
}

const useStyles = makeStyles((theme) => ({
  root: {
    minWidth: theme.breakpoints.width("xs")
  },
  content: {
    "&:last-child": {
      paddingBottom: theme.spacing(2)
    }
  },
  selectCursor: {
    cursor: "pointer"
  },
  zeroPadding: {
    padding: theme.spacing(0),
    "&>*": {
      margin: theme.spacing(1)
    },
    "&>*:first-child": {
      marginLeft: 0
    }
  },
  expand: {
    transform: 'rotate(0deg)',
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest,
    }),
  },
  expandOpen: {
    transform: 'rotate(180deg)',
  }
}));

export default function BillCard(props: BillCardProps) {
  const classes = useStyles();
  const [actionsOpen, toggleActions] = useState(false);
  const [{ loading: paymentLoading, error: paymentError, data: paymentData }, receiveBalance] = useAxios<APIResponse<null>>({
    url: `/bill/${props.pay?.id}/payment`,
    method: "POST",
  }, { manual: true });

  useEffect(() => {
    if (paymentData) {
      toast.success("Payment Received");
      props.pay?.refresh();
    }
    //eslint-disable-next-line
  }, [paymentData])

  useEffect(() => {
    if (paymentError) {
      handleAxiosError(paymentError);
    }
  }, [paymentError]);

  return (
    <Card className={classes.root} variant="outlined">
      <CardContent className={classes.content}>
        <Grid
          container
          direction="row"
          justify="space-between"
          alignItems="stretch"
        >
          <Grid item xs>
            <CardActionArea onClick={props.onClickAction}>
              <Typography component="label" variant="h6">
                {props.primaryText || "Customer Name"}
              </Typography>
              <Typography component="label" variant="subtitle2" display="block">
                <strong>{props.secondaryText || "Payment"}</strong>
              </Typography>
              {props.timestamp &&
                <Typography component="label" variant="subtitle2" display="block" color="textSecondary">
                  <QueryBuilderRoundedIcon fontSize="inherit" style={{ verticalAlign: "middle" }} />&nbsp;{props.timestamp}
                </Typography>
              }
            </CardActionArea>
          </Grid>
          <Grid item>
            <Typography component="label" variant="h4" align="right" display="block">
               {props.rightPrimary?.toINR() || 12345.25}
            </Typography>
            <Typography
              color="textSecondary"
              variant="subtitle2"
              align="right"
            >
              {props.rightSecondary}
            </Typography>
          </Grid>
          <Grid item style={{ display: "flex", alignItems: "center" }}>
            <IconButton
              className={clsx(classes.expand, {
                [classes.expandOpen]: actionsOpen,
              })}
              onClick={() => toggleActions(!actionsOpen)}
              aria-expanded={actionsOpen}
              aria-label="Options"
            >
              <MoreVertIcon />
            </IconButton>
          </Grid>
        </Grid>
        <Collapse in={actionsOpen} timeout="auto" unmountOnExit>
          <CardActions className={classes.zeroPadding}>
            {props.location &&
              <Button
                variant="outlined"
                color="primary"
                size="small"
                startIcon={<RoomRounded />}
                onClick={() => { window.open(`https://www.google.com/maps/search/?api=1&query=${props.location?.join(",")}`) }}
              >
                Map
              </Button>
            }
            {props.pay?.credit &&
              <Button
                variant="outlined"
                disabled={paymentLoading}
                size="small"
                onClick={() => { receiveBalance({ data: { paidAmount: (props.pay?.billAmount ?? 0) - (props.pay?.paidAmount ?? 0) } }) }}
              >
                PAY {((props.pay?.billAmount ?? 0) - (props.pay?.paidAmount ?? 0)).toINR()}
              </Button>
            }
            {props.deleteAction &&
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                startIcon={<DeleteIcon />}
                onClick={() => { if (props.deleteAction) return props.deleteAction() }}
              >
                Delete
              </Button>
            }
          </CardActions>
        </Collapse>
      </CardContent>
    </Card>
  );
}
