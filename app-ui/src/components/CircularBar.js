import React, { Component } from "react";
import { CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

export default class CircularBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      percent: this.props.percent
    };
  }

  render() {
    return (
      <div>
        <CircularProgressbar
          value={this.props.percent}
          text={`${this.props.percent}%`}
        />
      </div>
    );
  }

  componentDidMount() {}
}
