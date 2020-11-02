import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import { CardActionArea, Grid } from "@material-ui/core";
import LocationOnIcon from "@material-ui/icons/LocationOn";

export interface CustomerCardProps {
  customerName?: String;
  place?: String;
  phone?: Number;
  showLocation?(): void;
  cardOnClick?(): void;
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

export default function CustomerCard(props: CustomerCardProps) {
  const classes = useStyles();
  const [actionsOpen, toggleActions] = useState(false);
  return (
    <Card className={classes.root} variant="outlined">
      <CardContent className={classes.content}>
        <Grid
          container
          direction="row"
          justify="space-between"
          alignItems="center"
        >
          <Grid item xs>
            <CardActionArea
              onClick={() => {
                if (props.cardOnClick) return props.cardOnClick();
              }}
            >
              <Typography variant="h5">
                {props.customerName || "Customer Name"}
              </Typography>
              <Typography display="inline" variant="subtitle1">
                {props.place ? props.place + " - " : ""}
              </Typography>
              <Typography display="inline" variant="subtitle1">
                {props.phone || "9457845695"}
              </Typography>
            </CardActionArea>
          </Grid>

          <Grid item xs>
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
            {props.showLocation ? (
              <Button
                variant="outlined"
                color="primary"
                size="small"
                startIcon={<LocationOnIcon />}
                onClick={() => {
                  if (props.showLocation) return props.showLocation();
                }}
              >
                Open in Map
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
