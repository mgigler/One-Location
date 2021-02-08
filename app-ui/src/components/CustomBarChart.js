import React, { Component } from "react";
import ReactApexChart from "react-apexcharts";

export default class CustomBarChart extends Component {
  constructor(props) {
    super(props);
    try {
          this.state = {
      series: this.props.regionAirbnbSharenowAvailability,
      options: {
        chart: {
          type: "bar",
          height: 140
        },
        plotOptions: {
          bar: {
            barHeight: "100%",
            distributed: true,
            horizontal: true,
            dataLabels: {
              position: "bottom"
            }
          }
        },
        colors: ["#FF6384", "#36A2EB"],
        dataLabels: {
          enabled: true,
          textAnchor: "start",
          style: {
            colors: ["#fff"]
          },
          formatter: function(val, opt) {
            return opt.w.globals.labels[opt.dataPointIndex] + ":  " + val;
          },
          offsetX: 0,
          dropShadow: {
            enabled: true
          }
        },
        stroke: {
          width: 1,
          colors: ["#fff"]
        },
        xaxis: {
          categories: ["Airbnb", "ShareNow"],
          max: 1
        },
        yaxis: {
          labels: {
            show: false
          }
        },

        tooltip: {
          theme: "dark",
          x: {
            show: false
          },
          y: {
            title: {
              formatter: function() {
                return "";
              }
            }
          }
        }
      }
    };

    } catch(e) {

    }

  }

  render() {
    return (
      <div id="chart">
        <ReactApexChart
          options={this.state.options}
          series={this.props.series}
          type="bar"
          height={140}
        />
      </div>
    );
  }
}
