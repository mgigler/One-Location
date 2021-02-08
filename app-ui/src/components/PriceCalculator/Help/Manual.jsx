import React from 'react';

import Grid from "@material-ui/core/Grid";
import Typography from '@material-ui/core/Typography';

import EventIcon from '@material-ui/icons/Event';
import Avatar from "@material-ui/core/Avatar";
import { makeStyles } from '@material-ui/core/styles';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCogs } from '@fortawesome/free-solid-svg-icons'
import { faFlagCheckered } from '@fortawesome/free-solid-svg-icons'
import { faDatabase } from '@fortawesome/free-solid-svg-icons'

const title = "Manual"
const originAndDestinationTitle = "Origin and Destination"
const originAndDestinationText = "Specify origin and destination to trigger the price calculation."
const dataSourcesTitle = "Data Sources"
const dataSourcesText = "Specify considered data sources to adapt the price calculation."
const dataTitle = "Date and Time"
const dataText = "Specify date and time to adapt the price calculation."

export default class Manual extends React.Component {
    constructor(props) {
        super(props);
        this.handleActiveStep = this.handleActiveStep.bind(this);
    }
    handleActiveStep(event) {
        const id = parseInt(event.currentTarget.id, 10);
        this.props.handleActiveStep(id);
    }
    render() {
        let data = [];

        data.push({ step: 0, icon: faFlagCheckered, title: originAndDestinationTitle, text: originAndDestinationText });
        data.push({ step: 1, icon: faDatabase, title: dataSourcesTitle, text: dataSourcesText });
        data.push({ step: 2, icon: "", type: "event", title: dataTitle, text: dataText });
        return (
            <React.Fragment>
                <Grid container>
                    <Grid item xs={3} sm={3} md={false} lg={false} />
                    <Grid item xs={9} sm={9} md={5} lg={3}>
                        <Grid container justify={"center"} spacing={1} alignContent="center" alignItems="center" style={{ paddingBottom: "10px" }}>
                            <Grid item>
                                <Avatar style={{ backgroundImage: 'linear-gradient( 95deg,rgb(242,113,33) 0%,rgb(233,64,87) 50%,rgb(138,35,135) 100%)' }}>
                                    <FontAwesomeIcon icon={faCogs}></FontAwesomeIcon>
                                </Avatar>
                            </Grid>
                            <Grid item>
                                <Typography variant="h6">{title}</Typography>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item xs={false} sm={1} md={5} lg={7} />
                    <Grid item xs={12} sm={12}>
                        <ManualTable data={data} handleActiveStep={this.handleActiveStep} activeStep={this.props.activeStep} />
                    </Grid>
                </Grid>
            </React.Fragment>
        )
    }
}

const useStyles = makeStyles({
    highlightIcon: {
        backgroundImage: 'linear-gradient( 95deg,rgb(242,113,33) 0%,rgb(233,64,87) 50%,rgb(138,35,135) 100%)'
    }
});
function ManualTable(props) {
    const classes = useStyles();
    return (
        props.data.map((entry) =>
            <div key={entry.title.concat("_ClickDiv")} id={entry.step} onClick={props.handleActiveStep}>
                <Grid item key={entry.title.concat("_ManualTable")} >
                    <Grid container direction="row">

                        <Grid item xs={3} sm={3}>
                            <Grid container justify="center" alignContent="center" alignItems="center" style={{ height: "100%" }}>


                                <Grid item >

                                    {entry.step === props.activeStep &&
                                        <Avatar className={classes.highlightIcon}>
                                            {entry.type === 'event' ? (
                                                <EventIcon />
                                            ) : (
                                                    <FontAwesomeIcon icon={entry.icon} ></FontAwesomeIcon>
                                                )}
                                        </Avatar>}
                                    {entry.step !== props.activeStep &&
                                        <Avatar>
                                            {entry.type === 'event' ? (
                                                <EventIcon />
                                            ) : (
                                                    <FontAwesomeIcon icon={entry.icon} ></FontAwesomeIcon>
                                                )}
                                        </Avatar>}

                                </Grid>

                            </Grid>
                        </Grid>
                        <Grid item xs={9} sm={9}>
                            <Grid container direction="column">
                                <Grid item>
                                    <Typography variant="h6">
                                        {entry.title}
                                    </Typography>
                                    <Typography variant="subtitle1">
                                        {entry.text}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Grid>

                    </Grid>
                </Grid>
            </div>)
    );
}
