import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import { CardActionArea, Grid } from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/Delete";

export interface BillCardData {
  customerName: String;
  timestamp: String;
  billAmount: Number;
  deleteAction(): void;
}

const useStyles = makeStyles((theme) => ({
  root: {
    minWidth: 275
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

export default function BillCard(data: BillCardData) {
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
            <CardActionArea>
              <Typography variant="h5">
                {data.customerName || "Customer Name"}
              </Typography>
              <Typography variant="subtitle1">
                {data.timestamp || "Timestamp"}
              </Typography>
            </CardActionArea>
          </Grid>

          <Grid item xs>
            <Typography variant="h4" align="right">
              ₹ {data.billAmount || 12345.25}
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
            {data.deleteAction ? (
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                startIcon={<DeleteIcon />}
                onClick={() => data.deleteAction()}
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
