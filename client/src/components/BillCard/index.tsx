import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import { CardActionArea, Grid } from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/Delete";
import moment from "moment";

export interface BillCardProps {
  customerName?: String;
  timestamp?: String;
  billAmount?: Number;
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
    padding: theme.spacing(0)
  }
}));

export default function BillCard(props: BillCardProps) {
  const classes = useStyles();
  const [actionsOpen, toggleActions] = useState(false);
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
              <Typography variant="h5">
                {props.customerName || "Customer Name"}
              </Typography>
              <Typography variant="subtitle1">
                {moment(props.timestamp?.toString()).format('MMM D YYYY, h:mm a') || "Timestamp"}
              </Typography>
            </CardActionArea>
          </Grid>

          <Grid item xs>
            <Typography variant="h4" align="right">
              ₹ {props.billAmount || 12345.25}
            </Typography>
            <Typography
              color="textSecondary"
              variant="subtitle2"
              align="right"
              className={classes.selectCursor}
              onClick={() => toggleActions(!actionsOpen)}
            >
              MORE ACTIONS
            </Typography>
          </Grid>
        </Grid>

        {actionsOpen ? (
          <CardActions className={classes.zeroPadding}>
            {props.deleteAction ? (
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                startIcon={<DeleteIcon />}
                onClick={() => { if (props.deleteAction) return props.deleteAction() }}
              >
                Delete
              </Button>
            ) : (
                ""
              )}
          </CardActions>
        ) : (
            ""
          )}
      </CardContent>
    </Card>
  );
}
