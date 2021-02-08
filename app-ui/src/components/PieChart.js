import React, { Component } from "react";
import { Pie } from "react-chartjs-2";

export default class PieDemo extends Component {
  
  render() {
    const data = {
      labels: ["AirBnB", "ShareNow"],
      datasets: [
        {
          data: this.props.pieChartData,
          backgroundColor: ["#FF6384", "#36A2EB"],
          hoverBackgroundColor: ["#FF6384", "#36A2EB"]
        }
      ]
    };

    return (
      <div>
        <Pie ref="chart" data={data} />
      </div>
    );
  }

  componentDidMount() {
    const { datasets } = this.refs.chart.chartInstance.data;
    console.log(datasets[0].data);
  }
}
