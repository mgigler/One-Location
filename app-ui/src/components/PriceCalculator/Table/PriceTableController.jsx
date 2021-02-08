import React from "react";

import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography"
import ButtonBase from '@material-ui/core/ButtonBase';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faMinus } from '@fortawesome/free-solid-svg-icons'

import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
    responsiveTable: {
        [theme.breakpoints.down("xs")]: {
            display: "none"
        }
    }
}));

export default function PriceTableController(props) {

    const classes = useStyles();

    const messageOpen = "Open Pricing Table";
    const messageClose = "Close Pricing Table";

    const iconOpen = faPlus;
    const iconClose = faMinus;

    const [open, setOpen] = React.useState(props.priceTableOpen);
    const [message, setMessage] = React.useState((() => { if (open) { 
   return messageClose; } else {return messageOpen;} }));
    const [icon, setIcon] = React.useState((() => { if (open) { return iconClose; } else {return iconOpen;} }));

    const toggle = () => {

        props.toggle();

        if (message === messageOpen) {
            setMessage(messageClose);
            setIcon(iconClose)
        }
        else {
            setMessage(messageOpen);
            setIcon(iconOpen)
        }
    }

    return (
        <ButtonBase onClick={toggle} className={classes.responsiveTable}>
            <Grid container spacing={2}>
                <Grid item>
                    <FontAwesomeIcon icon={icon} style={{ color: "#ed553f" }} />
                </Grid>
                <Grid item>
                    <Typography color="primary">
                        {message}
                    </Typography>
                </Grid>
            </Grid>
        </ButtonBase>
    );
}
