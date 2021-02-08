import React from "react";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";

export default function PriceHeaderDescription() {
  return (
    <Grid container justify="center">
      <Grid item xs={12}>
        <Typography variant="h3" style={{ textAlign: "center" }}>
          Dynamic Price Calculator
        </Typography>
      </Grid>
      <Grid item>
        <Grid container justify="center">
          <Grid item xs={8}>
            <Typography variant="subtitle2">
              The Dynamic Price Calculator helps in finding the real
              price which can be charged for a Car-Sharing-Trip between two locations.
              Additionally, the data sources to be included in the
              calculation as well as a specific date and time can be specified.
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}
