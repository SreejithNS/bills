import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import { CardActionArea, Grid } from "@material-ui/core";
import LocationOnIcon from "@material-ui/icons/LocationOn";

export interface CustomerCardData {
  customerName: String;
  place: String;
  phone: Number;
  showLocation?(): void;
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

export default function CustomerCard(data: CustomerCardData) {
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
            <CardActionArea>
              <Typography variant="h5">
                {data.customerName || "Customer Name"}
              </Typography>
              <Typography display="inline" variant="subtitle1">
                {data.place ? data.place + " - " : ""}
              </Typography>
              <Typography display="inline" variant="subtitle1">
                {data.phone || "9457845695"}
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
            {data.showLocation ? (
              <Button
                variant="outlined"
                color="primary"
                size="small"
                startIcon={<LocationOnIcon />}
                onClick={() =>
                  data.showLocation
                    ? data.showLocation()
                    : console.error("Location function not received")
                }
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
