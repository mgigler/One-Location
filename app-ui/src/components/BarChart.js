import React, { Component } from "react";
import ReactApexChart from "react-apexcharts";

export default class BarChart extends Component {
  constructor(props) {
    super(props);
    console.log(this.props.categories);
    this.state = {
      bufferCategories: [],
      categories: this.props.categories,
      options: {
        chart: {
          stacked: false
        },
        plotOptions: {
          bar: {
            horizontal: true
          }
        },
        stroke: {
          width: 1,
          colors: ["#fff"]
        },

        title: {
          text: ""
        },
        xaxis: {
          categories: [],
          max: 100,
          labels: {
            formatter: function(val) {
              return val + "%";
            },
            hideOverlappingLabels: true,
            style: {
              fontSize: "10px"
            }
          }
        },
        yaxis: {
          title: {
            text: undefined
          }
        },
        tooltip: {
          y: {
            formatter: function(val) {
              return val + "%";
            }
          }
        },
        fill: {
          opacity: 1
        },

        legend: {
          position: "top",
          horizontalAlign: "left",
          offsetX: 10
        }
      },
      series: this.props.series
    };
  }

  render() {
    return (
      <div id="chart">
        <ReactApexChart
          options={this.state.options}
          series={this.props.series}
          type="bar"
          height="350"
        />
      </div>
    );
  }

  componentDidUpdate(prevProps) {
    if (prevProps.categories !== this.props.categories) {
      this.setState({
        options: {
          ...this.state.options,
          xaxis: {
            ...this.state.options.xaxis,
            categories: this.props.categories
          }
        }
      });
    }
  }

  componentDidMount() {
    this.setState({
      options: {
        ...this.state.options,
        xaxis: {
          ...this.state.options.xaxis,
          categories: this.props.categories
        }
      }
    });
  }
}
