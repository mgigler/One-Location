import React from "react";

import moment from 'moment';

import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography"
import Tooltip from '@material-ui/core/Tooltip';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import ArrowForwardSharpIcon from '@material-ui/icons/ArrowForwardSharp';

import DistrictCheckboxes from "./Stepper/Datasources/DistrictCheckboxes";

import DistrictDateTimePicker from "./DateTime/DistrictDateTimePicker";
import PriceRequest from "../../classes/PriceRequest";
import PriceService from "../../services/PriceService"

import PriceHeaderStepper from "./Stepper/PriceHeaderStepper";
import DistrictAutoComplete from './Stepper/OriginDestination/DistrictAutoComplete';

import PriceResult from "./PriceResult/PriceResult";
import PriceReply from "../../classes/PriceReply";
import HelpDialog from './Help/HelpDialog';

import PriceHeaderDescription from "./Description/PriceHeaderDescription"

export default class PriceHeader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      steps: [{ index: 0, text: 'Origin and Destination' }, { index: 1, text: 'Data Sources' }, { index: 2, text: 'Date and Time' }],
      //Initial Price Request
      priceRequest: new PriceRequest("", "",
        [{ name: "Airbnb", value: true }, { name: "Availability", value: true }, { name: "Public Transport", value: true }, { name: "Taxi", value: true }, { name: "Traffic", value: true }, { name: "Weather", value: true }], new moment()),
      priceReply: new PriceReply(),
      priceCalculated: false,
      recalculation: false,
      loading: true,
      activeStep: 0,
      blocked: false
    };

    this.handleFromChange = this.handleFromChange.bind(this);
    this.handleToChange = this.handleToChange.bind(this);
    this.handlePriceChange = this.handlePriceChange.bind(this);
    this.handleCheckboxChange = this.handleCheckboxChange.bind(this);
    this.handleDateChange = this.handleDateChange.bind(this);
    this.handleNext = this.handleNext.bind(this);
    this.handlePrev = this.handlePrev.bind(this);
    this.handleActiveStep = this.handleActiveStep.bind(this);
  }


  handleFromChange(event, value) {
    let pr = this.state.priceRequest;
    let newValue = "";

    if (value !== null || !typeof value === undefined) {
      if (value.name !== null || !typeof value.name === undefined) {
        newValue = value.name
      }
    }

    pr.from = newValue;
    this.setState({ priceRequest: pr });
    if (this.state.priceRequest.to !== "" && pr.from !== "") {
      this.handlePriceChange();
    }
    else {
      this.setState({ priceCalculated: false })
    }
  }

  handleToChange(event, value) {
    let pr = this.state.priceRequest;
    let newValue = "";

    if (value !== null || !typeof value === undefined) {
      if (value.name !== null || !typeof value.name === undefined) {
        newValue = value.name
      }
    }

    pr.to = newValue;
    this.setState({ priceRequest: pr });
    if (this.state.priceRequest.from !== "" && pr.to !== "") {
      this.handlePriceChange();
    }
    else {
      this.setState({ priceCalculated: false })
    }
  }

  async handlePriceChange() {
    if (!this.state.priceCalculated) {
      await this.setState({ blocked: true });
    }
    else {
      await this.setState({ blocked: false, recalculation: { value: true, from: this.state.priceRequest.from, to: this.state.priceRequest.to } });
    }

    try {
      let priceReply = await PriceService.getPrice(this.state.priceRequest);
      this.setState({ priceReply: priceReply, priceCalculated: true, blocked: false, recalculation: { value: false, from: "", to: "" } });
    }
    catch{
      this.setState({ blocked: false })

    }
  }

  handleCheckboxChange(key, newValue) {
    let pr = this.state.priceRequest;
    for (let index = 0; index < pr.checkBoxOptions.length; index++) {
      if (pr.checkBoxOptions[index].name === key) {
        pr.checkBoxOptions[index].value = newValue;
        if (this.state.priceRequest.to !== "" && this.state.priceRequest.from !== "") {
          this.handlePriceChange();
        }
        break;
      }

    }
    this.setState({ priceRequest: pr });
  }

  handleDateChange(moment) {
    let pr = this.state.priceRequest;
    pr.dateTime = moment;
    this.setState({ priceRequest: pr });
    if (this.state.priceRequest.to !== "" && this.state.priceRequest.from !== "") {
      this.handlePriceChange();
    }
  }

  handleNext() {
    let nextStep = this.state.activeStep + 1;
    if (this.state.activeStep === this.state.steps.length - 1) {
      nextStep = 0;
    }
    this.setState({ activeStep: nextStep });
  }

  handlePrev() {

    let nextStep = this.state.activeStep - 1;
    if (this.state.activeStep === 0) {
      nextStep = this.state.steps.length - 1;
    }
    this.setState({ activeStep: nextStep });

  }

  handleActiveStep(id) {
    this.setState({ activeStep: id });
  }

  componentDidMount() {
    this.setState({
      loading: false
    })
  }

  render() {
    if (this.state.loading) {
      return <p>Loading</p>;
    } else {

      return (
        <React.Fragment>
         <PriceHeaderDescription/>
         
          <Grid container justify="space-between" style={{marginTop:"10px"}}>
            <Grid item sm={7} xs={12}>
              <Grid container spacing={1} direction="column" >
                <Grid item sm={12} xs={12} >
                  <PriceHeaderStepper steps={this.state.steps} activeStep={this.state.activeStep} setActiveStep={this.handleActiveStep} />
                </Grid>

                <Grid container>
                  <Grid item sm={1} xs={1} style={{ textAlign: "center" }}>
                    <Tooltip key="prevStepButton" title="Go to Previous Step" aria-label="prevStep" onClick={this.handlePrev}  >
                      <ArrowBackIcon />
                    </Tooltip>
                  </Grid>

                  <Grid item sm={10} xs={10}>
                    <Grid container spacing={0} direction="column" alignItems="center" justify="center">

                      {this.state.activeStep === 0 && <Grid item sm={12} xs={12} style={{ textAlign: "center", minHeight: "380px" }}>
                        <Typography variant="h6">Specify origin and destination to trigger the price calculation.</Typography>
                        <HelpDialog handleActiveStep={this.handleActiveStep} activeStep={this.state.activeStep} />

                        <DistrictAutoComplete label="Origin" value={this.state.priceRequest.from} options={this.props.data} onChange={this.handleFromChange} />
                        <DistrictAutoComplete label="Destination" value={this.state.priceRequest.to} options={this.props.data} onChange={this.handleToChange} />
                      </Grid>}

                      {this.state.activeStep === 1 && <Grid item sm={12} xs={12} style={{ minHeight: "380px" }}>
                      <Typography variant="h6" style={{textAlign:"center"}}>Specify considered data sources to adapt the price calculation.</Typography>
                        <HelpDialog handleActiveStep={this.handleActiveStep} activeStep={this.state.activeStep} />
                        <DistrictCheckboxes options={this.state.priceRequest.checkBoxOptions} handleChange={this.handleCheckboxChange} />
                      </Grid>}

                      {this.state.activeStep === 2 && <Grid item sm={12} xs={12} style={{ minHeight: "380px" }}>
                      <Typography variant="h6">Specify date and time to adapt the price calculation.</Typography>
                        <HelpDialog handleActiveStep={this.handleActiveStep} activeStep={this.state.activeStep} />
                        <Grid container spacing={0} direction="column" alignItems="center" justify="center">
                          <Grid item sm={12} xs={12}>
                            <DistrictDateTimePicker date={this.state.priceRequest.dateTime} handleChange={this.handleDateChange} priceCalculated={this.state.priceCalculated} style={{ alignItems: "center" }} />
                          </Grid>
                        </Grid>
                      </Grid>}

                    </Grid>
                  </Grid>
                  <Grid item sm={1} xs={1} style={{ textAlign: "center" }}>
                    <Tooltip key="nextStepButton" title="Go to Next Step" aria-label="nextStep" onClick={this.handleNext}  >
                      <ArrowForwardSharpIcon />
                    </Tooltip>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            <Grid item sm={5} xs={12} height="100%">
              <Grid
                container
                spacing={0}
                direction="column"
                alignItems="center"
                justify="center"
                style={{ minHeight: '500px' }}
              >
                <Grid item xs={12} sm={12} style={{ width: "100%" }}>
                  <PriceResult blocked={this.state.blocked} recalculation={this.state.recalculation} priceReply={this.state.priceReply} priceCalculated={this.state.priceCalculated} handleActiveStep={this.handleActiveStep} activeStep={this.state.activeStep} />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </React.Fragment>
      );
    }
  }
}
