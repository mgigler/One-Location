import React from "react";
import Button from "./Button";
import { Link } from "react-router-dom";
import Typography from '@material-ui/core/Typography';

import { withStyles } from "@material-ui/core/styles";
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
    button: {
        width: 240,
        height: 60,
        [theme.breakpoints.up("xl")]: {
            height: 90
        }
    },
    [theme.breakpoints.down("lg")]: {
        height: 80
    }
}));

function MenuButton(props) {
    const classes = useStyles();


    return (
        <Link
            to={props.link}
            style={{ textDecoration: "none" }}
            color="inherit"
            variant="h6"
            underline="none"
            className={classes.title}
        >
            <Button
                color="secondary"
                variant="contained"
                size="large"
                className={classes.button}
                disableRipple
            >
                <Typography>
                    {props.title}
                </Typography>

            </Button>
        </Link>
    );
}
export default MenuButton;
