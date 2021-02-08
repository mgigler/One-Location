import React, { Component } from "react";
import "react-datez/dist/css/react-datez.css";
import { ReactDatez } from "react-datez";
import moment from "moment";

/*function valueLabelFormat(value) {
  return `${value}:00`;
}*/

export default class DatePicker extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dateInput: moment("2020-01-30").format("YYYY-MM-DD")
    };
    this.handleDateChange = this.handleDateChange.bind(this);
  }

  handleDateChange(value) {
    var formattedDate = moment(value).format("YYYY-MM-DD"); //use this format when querying the backend
    this.setState({ dateInput: formattedDate });
    this.props.sendData(formattedDate);
  }

  render() {
    return (
      <div className="row">
        <div className="col-md-2">Date:</div>
        <div className="col-md-4">
          <ReactDatez
            allowFuture={false}
            dateFormat="YYYY-MM-DD"
            name="dateInput"
            value={this.state.dateInput}
            handleChange={this.handleDateChange}
            inputStyle={{
              width: "210px",
              height: "20px",
              fontSize: "10px"
            }}
            allowPast={true}
            position={"left"}
          />
        </div>
      </div>
    );
  }

  componentDidMount() {}
}
