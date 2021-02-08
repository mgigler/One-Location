import React from "react";

import { withStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";

import Typography from "../../components/Menu/Typography";
import Layout from "../../components/Menu/Layout";
import MenuButton from "../../components/Menu/MenuButton";

const backgroundImage = "/background.png";

const styles = theme => ({
  background: {
    backgroundImage: `url(${backgroundImage})`,
    backgroundColor: "#7fc7d9", // Average color of the background image.
    backgroundPosition: "center"
  },
  h5: {
    marginBottom: theme.spacing(5),
    marginTop: theme.spacing(2),
    [theme.breakpoints.up("sm")]: {
      marginTop: theme.spacing(2)
    }
  },
  more: {
    marginTop: theme.spacing(2)
  }
});

function Home(props) {
  const { classes } = props;
  const buttonTitleMap = "Map";
  const linkMap = "/Map";
  const buttonTitlePriceCalculator = "Price Calculator";
  const linkPriceCalculator = "/pricecalculator";

  return (
    <Grid container style={{ width: "100%" }}>
      <Grid item style={{ width: "100%" }}>
        <Layout backgroundClassName={classes.background}>
          {/* Increase the network loading priority of the background image. */}
          <img style={{ display: "none" }} src={backgroundImage} alt="" />
      
          <Typography
            color="inherit"
            align="center"
            variant="h1"
            style={{ color: "#005478", textTransform: "none", marginBottom:"30px"    }}>
          
          
           The Joy of <strong style={{ color: "#ff5a60" }}>Shared</strong> Success
          </Typography>
          
          <Typography
            color="inherit"
            align="center"
            variant="h2"
            marked="center"
          >
            One Position
          </Typography>
          <Typography
            color="inherit"
            align="center"
            variant="h5"
            className={classes.h5}
          >
            Discovering the relationship between Share Now cars and Airbnbs
          </Typography>
          <Grid
            container
            alignItems="center"
            justify="center"
            alignContent="space-between"
            spacing={3}
          >
            <Grid item>
              <MenuButton title={buttonTitleMap} link={linkMap} {...props} />
            </Grid>
            <Grid item>
              <MenuButton
                title={buttonTitlePriceCalculator}
                link={linkPriceCalculator}
                {...props}
              />
            </Grid>
          </Grid>
        </Layout>
      </Grid>
    </Grid>
  );
}

export default withStyles(styles)(Home);
