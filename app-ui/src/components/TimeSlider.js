import React, { Component } from "react";
import Slider from "@material-ui/core/Slider";
import { createMuiTheme } from "@material-ui/core/styles";
import { ThemeProvider } from "@material-ui/styles";

function valueLabelFormat(value) {
  return `${value}:00`;
}

export default class TimeSlider extends Component {
  constructor(props) {
    super(props);
    this.state = {
      timeSlider: 20
    };
  }

  sliderHandleChange = name => (e, value) => {
    this.setState({
      [name]: value
    });
    this.props.sendData(value);
  };

  render() {
    const { timeSlider } = this.state;
    const muiTheme = createMuiTheme({
      overrides: {
        MuiSlider: {
          thumb: {
            color: "#009688"
          },
          track: {
            height: 3,
            color: "#009688"
          },
          rail: {
            height: 3,
            color: "#009688"
          },
          valueLabel: {
            left: "calc(-50%)",
            top: 23,
            "& *": {
              background: "transparent",
              color: "#000"
            }
          }
        }
      }
    });

    return (
      <div className="row">
        <div className="col-md-2" style={{ paddingTop: "5px" }}>
          Time:
        </div>
        <div className="col-md-10">
          <ThemeProvider theme={muiTheme}>
            <Slider
              defaultValue={20}
              value={timeSlider}
              getAriaValueText={valueLabelFormat}
              valueLabelFormat={valueLabelFormat}
              aria-labelledby="range-slider"
              valueLabelDisplay="on"
              step={1}
              min={0}
              max={23}
              onChange={this.sliderHandleChange("timeSlider")}
            />
          </ThemeProvider>
        </div>
      </div>
    );
  }

  componentDidMount() {}
}
