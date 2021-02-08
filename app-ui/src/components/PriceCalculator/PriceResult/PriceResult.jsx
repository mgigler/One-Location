import React from 'react';

import Grid from "@material-ui/core/Grid";
import Table from "@material-ui/core/Table";
import { TableBody } from '@material-ui/core';
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import Avatar from "@material-ui/core/Avatar";
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTaxi, faTrain, faCloudSunRain, faCalendar, faTrafficLight, faChartPie } from '@fortawesome/free-solid-svg-icons'
import { faAirbnb, faAsymmetrik } from '@fortawesome/free-brands-svg-icons'

import Manual from '../Help/Manual'
import ProgressBar from './ProgressBar';

export default class PriceResult extends React.Component {

    render() {

        const priceReply = this.props.priceReply;

        //Setting Headers and Subheaders for the PriceResult
        const title = "Dynamic Price"

        const dateTitle = "Date and Time";
        const dateDateTitle = "Date";
        const dateTimeTitle = "Time";

        const airbnbTitle = "Airbnb";
        const airbnbFromTitle = priceReply.from;
        const airbnbToTitle = priceReply.to;

        const availabilityTitle = "Availability";
        const availabilityProvisionTitle = "Provision";
        const availabilityStartTitle = priceReply.from;
        const availabilityDestinationTitle = priceReply.to;

        const publicTransportTitle = "Public Transportation";
        const publicTransportPriceTitle = "Price";
        const publicTransportDurationTitle = "Duration";

        const taxiTitle = "Taxi";
        const taxiPriceTitle = "Price";

        const trafficTitle = "Traffic (Congestion)";
        const trafficCongestionLevelTitle = "Level";

        const weatherTitle = "Weather";
        const weatherTemperatureTitle = "Temperature";
        const weatherWindTitle="Wind";
        const weatherPrecipitationTitle="Precipitation";

        const modalSplitTitle = "Modal Split";
        const modalSplitCarTitle = "Car";
        const modalSplitMvvTitle="Public Transport";
        const modalSplitBikeTitle="Cycling or walking";
        const modalSplitPriceTitle="Optimal Price";

        //Specifying whether Table or Manual should be displayed
        let displayTable = false;
        let displayManual = false;

        let data = [];
        if (this.props.blocked) {
            return (
                <Grid container direction="column" justify={"center"} spacing={3} alignContent="center" alignItems="center" style={{ paddingBottom: "10px" }}>
                    <Grid item>
                        <ProgressBar size={100} thickness={5} />
                    </Grid>
                    <Grid item style={{ textAlign: "center" }}>
                        <Typography color="primary" variant="h5">Please wait a moment.</Typography>
                        <Typography color="primary">The Dynamic Price is calculated for you!</Typography>
                    </Grid>
                </Grid>
            );
        }
        else {

            if (this.props.priceCalculated) {

                displayTable = true;
                displayManual = false;

                //Build array for icon, title and properties(subtitles & values) for the PriceResult

                data.push({
                    icon: faCalendar, title: dateTitle, properties: [
                        { title: dateDateTitle, value: priceReply.dateTime.format('DD.MM.YYYY') },
                        { title: dateTimeTitle, value: priceReply.dateTime.format('HH:mm') }]
                });

                if (priceReply.airbnbIncluded) {
                    data.push({
                        icon: faAirbnb, title: airbnbTitle, properties: [
                            { title: airbnbFromTitle, value: String(priceReply.airbnbFromCount).concat(" of ").concat(String(priceReply.startExistingAirbnbs))},
                            { title: "",     value: "(".concat(String(priceReply.startOccupancyRate)).concat(" %)") },
                            { title: airbnbToTitle, value: String(priceReply.airbnbToCount).concat(" of ").concat(String(priceReply.destinationExistingAirbnbs)) },
                            { title: "", value: "(".concat(String(priceReply.destinationOccupancyRate)).concat(" %)") }]
                    });
                }

                if (priceReply.availabilityIncluded) {
                    data.push({
                        icon: faAsymmetrik, title: availabilityTitle, properties: [
                            { title: availabilityProvisionTitle, value: String(priceReply.availabilityProvision).concat(" €") },
                            { title: availabilityStartTitle, value: String(priceReply.availabilityStart).concat(" %") },
                            { title: availabilityDestinationTitle, value: String(priceReply.availabilityDestination.concat(" %")) }]
                    });
                }

                if (priceReply.publicTransportIncluded) {
                    data.push({
                        icon: faTrain, title: publicTransportTitle, properties: [
                            { title: publicTransportDurationTitle, value: String(priceReply.publicTransportDuration) },
                            { title: publicTransportPriceTitle, value: String(priceReply.publicTransportCosts) }]
                    });

                    data.push({
                        icon: faChartPie, title: modalSplitTitle, properties: [
                            {title: modalSplitCarTitle, value: String(priceReply.ModalSplitCar) + " % ("+ String(priceReply.ModalSplitOptimalCar)+"%)"},
                            {title: modalSplitMvvTitle, value: String(priceReply.ModalSplitMvv) + " % ("+ String(priceReply.ModalSplitOptimalMvv)+"%)"},
                            {title: modalSplitBikeTitle, value: String(priceReply.ModalSplitBike) + " % ("+ String(priceReply.ModalSplitOptimalBike)+"%)"},
                            {title: modalSplitPriceTitle, value: String(priceReply.ModalSplitPrice).concat(" €")}
                        ]
                    });
                }

                if (priceReply.taxiIncluded) {
                    data.push({
                        icon: faTaxi, title: taxiTitle, properties: [
                            { title: taxiPriceTitle, value: String(priceReply.taxiCosts).concat(" €") }]
                    });
                }

                if (priceReply.trafficIncluded) {
                    data.push({
                        icon: faTrafficLight, title: trafficTitle, properties: [
                            { title: trafficCongestionLevelTitle, value: String(priceReply.trafficLevelGeneral).concat(" (Scala 1 to 5)") }]
                    });
                }

                if (priceReply.weatherIncluded) {
                    data.push({
                        icon: faCloudSunRain, title: weatherTitle, properties: [
                            { title: weatherTemperatureTitle, value: String(priceReply.weatherTemperature) },
                            { title: weatherWindTitle, value: priceReply.wind },
                            { title: weatherPrecipitationTitle, value: String(priceReply.precipitation) }
                        ]
                    });
                }
            }
            else {
                displayTable = false;
                displayManual = true;
            }

            let smRecalculation = "";
            let centerRecalculation = "";
            if (this.props.recalculation.value) {
                smRecalculation = 8;
                centerRecalculation="space-around"
            }
            else {
                smRecalculation = 12;
                centerRecalculation="center"
            }
            return (
                <React.Fragment>
                    {displayTable &&
                        <React.Fragment>
                            <Grid container justify={centerRecalculation} spacing={0} alignContent={centerRecalculation} alignItems={"center"} style={{ paddingBottom: "10px" }}>
                                <Grid item>
                                    <Grid container justify={"center"} spacing={3} alignContent="center" alignItems="center">
                                    {this.props.recalculation.value &&
                                            <Grid item sm={4} xs={12} style={{textAlign:"center"}}>
                                                <ProgressBar size={30} thickness={5} />
                                                <Typography variant ="h5" color="primary">Recalculation in Progress</Typography>
                                            </Grid>}
                                        <Grid item sm={smRecalculation} xs={12}>
                                            <Typography variant="h6" style={{ textAlign: "center" }}>{title}</Typography>
                                            <Typography variant="subtitle1" style={{ textAlign: "center" }} >{priceReply.from} to {priceReply.to}   </Typography>
                                            <Grid container>
                                                <Grid item xs={12} sm={6} style={{ textAlign: "center" }}> {String(priceReply.sharenowDuration).concat(" Min.")}</Grid>
                                                <Grid item xs={12} sm={6} style={{ textAlign: "center" }}> {String(priceReply.distance).concat(" km")}</Grid>
                                            </Grid>
                                            <Grid item>
                                                <Grid container spacing={2} justify="center" alignItems="center">
                                                    <Grid item>
                                                        <Typography variant="h6" style={{ textAlign: "center" }}>{String(Number(priceReply.price).toFixed(2)).concat(" €")}</Typography>
                                                    </Grid>
                                                </Grid>
                                            </Grid>


                                            <Typography variant="subtitle2" style={{ textAlign: "center" }}>(Current Price: {String(Number(priceReply.sharenowPrice).toFixed(2)).concat(" €")})</Typography>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </Grid>

                            <Table key="PriceReplyTable" size="small">
                                <TableBody>
                                    <DetailedResult data={data} />
                                </TableBody>
                            </Table>
                        </React.Fragment>
                    }
                    {displayManual &&
                        <Manual handleActiveStep={this.props.handleActiveStep} activeStep={this.props.activeStep} />
                    }
                </React.Fragment>
            );
        }
    }
}


const useStyles = makeStyles(theme => ({
    priceResult: {
        backgroundImage: 'linear-gradient( 95deg,rgb(242,113,33) 0%,rgb(233,64,87) 50%,rgb(138,35,135) 100%)',
        textAlign: "center"
    }, responsiveTable: {
        [theme.breakpoints.up("xl")]: {
            textAlign:"left" 
        }
        }
}));

function DetailedResult(props) {
    const classes = useStyles();
    return (
        props.data.map((entry) =>
            <TableRow key={entry.title.concat("TableRow")} >
                <TableCell>
                    <Grid
                        container
                        alignItems="center"
                        justify="center"
                    >
                        <Grid item >
                            <Avatar className={classes.priceResult}>
                                <FontAwesomeIcon icon={entry.icon}> </FontAwesomeIcon>
                            </Avatar>
                        </Grid>

                    </Grid>

                </TableCell>
                <TableCell>
                    <Grid container direction="column">
                        <Grid item sm={12} xs={12}>
                            <Typography variant="h6">
                                {entry.title}
                            </Typography>
                        </Grid>
                    </Grid>
                    {entry.properties.map((property, index) =>
                        <Grid item sm={12} xs={12} key={entry.title.concat(property.title).concat(index)}>
                            <Grid container >
                                <Grid item sm={6} xs={12}>
                                    <Typography>{property.title}</Typography>
                                </Grid>
                                <Grid item sm={6} xs={12} style={{ whiteSpace: "nowrap" }} className={classes.responsiveTable}>
                                    <Typography align="right" className={classes.responsiveTable}> {property.value}</Typography>
                                </Grid>
                            </Grid>
                        </Grid>)}
                </TableCell>
            </TableRow>
        )
    );
}
