import React, { Component } from "react";
import "../../styles/App.css";
import DeckGL, { IconLayer, GeoJsonLayer } from "deck.gl";
import { StaticMap } from "react-map-gl";
import * as d3 from "d3";
import AirBnBIcon from "../../img/airBnBIcon.png";
import ShareNowIcon from "../../img/shareNowIcon.png";
import LineDemo from "../../components/LineChart";
import PieDemo from "../../components/PieChart";
import RegionService from "../../services/RegionService";
import AirbnbService from "../../services/AirbnbService";
import RegionAvailabilityService from "../../services/RegionAvailabilityService";
import Tree from "react-d3-tree";
import MultiToggle from "react-multi-toggle";
import PopPop from "react-poppop";
import {
  MAPBOX_ACCESS_TOKEN,
  groupOptions,
  lineChartGroupOptions,
  svgSquare,
  Box,
  initialViewState
} from "../ViewSettings";
import TimeSlider from "../../components/TimeSlider";
import BarChart from "../../components/BarChart";
import DatePicker from "../../components/DatePicker";
import CustomBarChart from "../../components/CustomBarChart";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

class Mapgl extends Component {
  state = { airBnBLocations: [], shareNowLocations: [] };

  constructor(props) {
    super(props);
    this.state = {
      categories: [],
      isVisible: true,
      districtName: "Munich",
      percent: 30,
      queryDate: "2020-01-30",
      queryTime: "20",
      timeOnly: false,
      series: [],
      treeView: "barChart",
      lineChartView: "weekOverview",
      airBnbData: [],
      car2goData: [],
      lineChartLabels: ["2020-01-30"],
      regionAirbnbSharenowAvailability: [{ data: [] }],
      pieChartData: [6000, 5000],
      availabilityTreeData: {},
      matrixTreeData: {},
      show: false,
      separation: { siblings: 1, nonSiblings: 1 },
      textLayout: { textAnchor: "start", x: 15, y: -10 },
      orientation: "horizontal",
      translate: {
        x: 10,
        y: 170
      },
      zoom: 0.7,
      x: 0,
      y: 0,
      isHovered: false
    };

    this.polygonClick = this.polygonClick.bind(this);
    this.getDataFromDatePicker = this.getDataFromDatePicker.bind(this);
    this.getDataFromTimeSlider = this.getDataFromTimeSlider.bind(this);
    this.getRegionAvailabilityData = this.getRegionAvailabilityData.bind(this);
    this.getMatrixTreeData = this.getMatrixTreeData.bind(this);
    this.getAirbnbSharenowAvailability = this.getAirbnbSharenowAvailability.bind(
      this
    );
    this.getRegionAirbnbShareNowNumber = this.getRegionAirbnbShareNowNumber.bind(
      this
    );
    this.getRegionAirbnbShareNowNumberForPieChart = this.getRegionAirbnbShareNowNumberForPieChart.bind(
      this
    );
    this.loadDateBasedData = this.loadDateBasedData.bind(this);
    this.loadTimeBasedData = this.loadTimeBasedData.bind(this);
  }

  componentDidMount() {
    this.fetchData();
  }

  loadDateBasedData() {
    this.getAirBnBData();
    this.getShareNowData();
    this.getAirbnbSharenowAvailability(
      this.state.queryDate,
      this.state.districtName
    );
    this.getRegionAvailabilityData(this.state.districtName, 3);
    this.getMatrixTreeData(
      this.state.districtName,
      this.state.queryDate,
      this.state.queryTime
    );
    this.getRegionAirbnbShareNowNumber(
      this.state.queryDate,
      this.state.districtName,
      this.state.timeOnly
    );
    this.getRegionAirbnbShareNowNumberForPieChart(
      this.state.queryDate,
      this.state.districtName
    );
  }

  loadTimeBasedData() {
    this.getRegionData();
    this.getShareNowData();
    this.getAirbnbSharenowAvailability(
      this.state.queryDate,
      this.state.districtName
    );
    this.getMatrixTreeData(
      this.state.districtName,
      this.state.queryDate,
      this.state.queryTime
    );
  }

  getDataFromDatePicker(value) {
    try {
      this.setState({ queryDate: value }, function() {
        this.onTreeViewSelect(this.state.treeView);
        this.loadDateBasedData();
      });
    } catch (e) {}
  }

  getDataFromTimeSlider(value) {
    try {
      this.setState({ queryTime: value }, function() {
        this.onTreeViewSelect(this.state.treeView);
        this.loadTimeBasedData();
      });
    } catch (e) {}
  }

  polygonClick(d) {
    try {
      if (d !== undefined) {
        let dName = d.object.name;
        this.setState({ districtName: dName });

        if (this.state.treeView === "matrix") {
          this.getMatrixTreeData(
            this.state.districtName,
            this.state.queryDate,
            this.state.queryTime
          );
        } else if (this.state.treeView === "availability") {
          this.getRegionAvailabilityData(dName, 3);
        }
        this.loadDateBasedData();
        this.loadTimeBasedData();
      }
    } catch (e) {}
  }

  fetchData = () => {
    this.getAirBnBData();
    this.getShareNowData();
    this.getRegionData();
    this.getRegionAirbnbShareNowNumber(
      this.state.queryDate,
      this.state.districtName,
      this.state.timeOnly
    );
    this.getAirbnbSharenowAvailability(
      this.state.queryDate,
      this.state.districtName
    );
    this.getRegionAvailabilityData(this.state.districtName, 3);
  };

  async getAirBnBData() {
    let airbnbService = new AirbnbService();
    let airbnbLocations = await airbnbService.getAirbnbData(
      this.state.queryDate
    );
    this.setState({ airBnBLocations: airbnbLocations });
  }

  async getRegionData() {
    try {
      let regionService = new RegionService();
      let regionData = await regionService.getData(
        this.state.queryDate,
        this.state.queryTime
      );
      this.setState({ districtsData: regionData });
    } catch (e) {}
  }

  async getRegionAvailabilityData(dName, months) {
    try {
      let regionAvailabilityService = new RegionAvailabilityService();
      let regionAvailabilityData = await regionAvailabilityService.getData(
        dName,
        months
      );

      let seriesData = regionAvailabilityData.series;
      let categoriesData = regionAvailabilityData.xaxis;

      this.setState({ categories: categoriesData });
      this.setState({ series: seriesData });

      let regionAvailabilityTreeData = await regionAvailabilityService.getTreeData(
        dName,
        months
      );

      this.setState({ availabilityTreeData: regionAvailabilityTreeData });
    } catch (e) {}
  }

  async getMatrixTreeData(dName, date, time) {
    try {
      if (dName === "Munich") {
        this.setState({ matrixTreeData: {} });
      } else {
        let regionService = new RegionService();
        let treeData = await regionService.getRegionCarDistData(
          dName,
          date,
          time
        );

        this.setState({ matrixTreeData: treeData });
      }
    } catch (e) {}
  }

  async getAirbnbSharenowAvailability(dName, date) {
    try {
      let regionAvailabilityService = new RegionAvailabilityService();
      let regionAvailabilityData = await regionAvailabilityService.getRegionAirbnbSharenowAvailability(
        dName,
        date
      );
      if (regionAvailabilityData === undefined) {
        this.setState({
          regionAirbnbSharenowAvailability: []
        });
      } else {
        this.setState({
          regionAirbnbSharenowAvailability: [regionAvailabilityData]
        });
      }
    } catch (e) {}
  }

  async getRegionAirbnbShareNowNumber(date, region, timeOnly) {
    try {
      if (this.state.lineChartView === "timeOverview") {
        timeOnly = true;
      } else if (this.state.lineChartView === "weekOverview") {
        timeOnly = false;
      }
      let regionService = new RegionService();
      let airbnbSharenowNumbers = await regionService.getRegionAirbnbSharenowNumbers(
        date,
        region,
        timeOnly
      );
      let airbnbDataXaxis = airbnbSharenowNumbers.airbnb.xaxis;
      let airbnbDataYaxis = airbnbSharenowNumbers.airbnb.yaxis;

      if (this.state.lineChartView === "weekOverview") {
        let airbnbYaxisData =
          airbnbSharenowNumbers.airbnb.yaxis[
            airbnbSharenowNumbers.airbnb.yaxis.length - 1
          ];
        let shareNowYaxisData =
          airbnbSharenowNumbers.sharenow.yaxis[
            airbnbSharenowNumbers.sharenow.yaxis.length - 1
          ];
        let pieChartArray = [];
        pieChartArray.push(airbnbYaxisData);
        pieChartArray.push(shareNowYaxisData);
        this.setState({ pieChartData: pieChartArray });
      }
      this.setState({ lineChartLabels: airbnbDataXaxis });
      this.setState({ airBnbData: airbnbDataYaxis });

      let shareNowDataYaxis = airbnbSharenowNumbers.sharenow.yaxis;

      this.setState({ car2goData: shareNowDataYaxis });
    } catch (e) {}
  }

  async getRegionAirbnbShareNowNumberForPieChart(date, region, timeOnly) {
    try {
      let regionService = new RegionService();
      let airbnbSharenowNumbers = await regionService.getRegionAirbnbSharenowNumbersforPieChart(
        date,
        region
      );

      let airbnbYaxisData =
        airbnbSharenowNumbers.airbnb.yaxis[
          airbnbSharenowNumbers.airbnb.yaxis.length - 1
        ];
      let shareNowYaxisData =
        airbnbSharenowNumbers.sharenow.yaxis[
          airbnbSharenowNumbers.sharenow.yaxis.length - 1
        ];
      let pieChartArray = [];
      pieChartArray.push(airbnbYaxisData);
      pieChartArray.push(shareNowYaxisData);
      this.setState({ pieChartData: pieChartArray });
    } catch (e) {}
  }

  onLineChartViewSelect = value => {
    this.setState({ lineChartView: value }, function() {
      if (value === "timeOverview") {
        this.setState({ timeOnly: true }, function() {
          this.getRegionAirbnbShareNowNumber(
            this.state.queryDate,
            this.state.districtName,
            this.state.timeOnly
          );
        });
      } else if (value === "weekOverview") {
        this.setState({ timeOnly: false }, function() {
          this.getRegionAirbnbShareNowNumber(
            this.state.queryDate,
            this.state.districtName,
            this.state.timeOnly
          );
        });
      }
    });
  };

  onTreeViewSelect = value => {
    this.setState({ treeView: value }, function() {
      if (value === "matrix") {
        this.setState({ separation: { siblings: 1, nonSiblings: 1 } });
        this.setState({ textAnchor: "start", x: 15, y: -10 });
        this.setState({ orientation: "horizontal" });
        this.setState({ translate: { x: 10, y: 115 } });
        this.setState({ zoom: 0.7 });
        this.getMatrixTreeData(
          this.state.districtName,
          this.state.queryDate,
          this.state.queryTime
        );
      } else if (value === "availability") {
        this.setState({ translate: { x: 10, y: 125 } });
        this.getRegionAvailabilityData(this.state.districtName, 3);
      }
    });
  };

  getShareNowData() {
    try {
      let queryString =
        "date=" + this.state.queryDate + "&hour=" + this.state.queryTime;
      d3.json(`${BACKEND_URL}/sharenow?${queryString}`).then(
        ({ sharenow_data }) =>
          this.setState({
            sharenowLocations: sharenow_data.map(d => ({
              longitude: d.longitude,
              latitude: d.latitude
            }))
          })
      );
    } catch (e) {}
  }
  toggleShow = show => {
    this.setState({ show });
  };

  _renderTooltip(object, x, y) {
    if (object !== undefined) {
      console.log(object.color[0]);
      let x = this.rgb2hsv(object.color[0], object.color[1], object.color[2]);
      console.log("return" + x);
      if (
        object.color[0] === 255 &&
        object.color[1] === 255 &&
        object.color[2] === 255
      ) {
        this.setState({ objectH: "N/A" });
      } else {
        this.setState({ objectH: Math.round((x / 120) * 100) + "%" });
      }
      this.setState({ hoveredRegion: object.name });
    }
  }

  _onMouseMove(e) {
    this.setState({ mX: e.screenX, mY: e.screenY });
  }

  rgb2hsv(r, g, b) {
    let rabs, gabs, babs, rr, gg, bb, h, s, v, diff, diffc, percentRoundFn;
    rabs = r / 255;
    gabs = g / 255;
    babs = b / 255;
    v = Math.max(rabs, gabs, babs);
    diff = v - Math.min(rabs, gabs, babs);
    diffc = c => (v - c) / 6 / diff + 1 / 2;
    percentRoundFn = num => Math.round(num * 100) / 100;
    if (diff == 0) {
      h = s = 0;
    } else {
      s = diff / v;
      rr = diffc(rabs);
      gg = diffc(gabs);
      bb = diffc(babs);

      if (rabs === v) {
        h = bb - gg;
      } else if (gabs === v) {
        h = 1 / 3 + rr - bb;
      } else if (babs === v) {
        h = 2 / 3 + gg - rr;
      }
      if (h < 0) {
        h += 1;
      } else if (h > 1) {
        h -= 1;
      }
    }
    let res = Math.round(h * 360);
    return res;
  }

  render() {
    const { treeView, lineChartView } = this.state;
    const { show } = this.state;
    const { objectH } = this.state;
    const layers = [
      new GeoJsonLayer({
        data: this.state.districtsData,
        opacity: 0.2,
        stroked: true,
        filled: true,
        extruded: false,
        wireframe: false,
        fp64: false,
        pickable: true,
        getFillColor: d => d.color,
        getLineColor: [0, 0, 0],
        getLineWidth: 50,
        onClick: info => this.polygonClick(info),
        onHover: ({ object, x, y }) => {
          this.setState({ isHovered: true });
          const tooltip = object;

          this._renderTooltip(object, x, y);
        }
      }),
      new IconLayer({
        id: "airBnBLocations",
        data: this.state.airBnBLocations,
        pickable: true,
        iconAtlas: AirBnBIcon,
        iconMapping: {
          airBnB: {
            x: 0,
            y: 0,
            width: 512,
            height: 512
          }
        },
        sizeScale: 20,
        getPosition: d => [parseFloat(d.longitude), parseFloat(d.latitude)],
        getIcon: d => "airBnB",
        onHover: d => console.log(d.object)
      }),
      new IconLayer({
        id: "sharenowLocations",
        data: this.state.sharenowLocations,
        pickable: false,
        iconAtlas: ShareNowIcon,
        iconMapping: {
          shareNowIcon: {
            x: 0,
            y: 0,
            width: 512,
            height: 512
          }
        },
        sizeScale: 20,
        getPosition: d => [parseFloat(d.longitude), parseFloat(d.latitude)],
        getIcon: d => "shareNowIcon"
      })
    ];
    return (
      <div
        className="container-fluid"
        onMouseMove={this._onMouseMove.bind(this)}
      >
        <div className="row ">
          <div className="col-sm-6 col-md-6 col-xl-6  scrollable">
            <Box
              style={{ paddingTop: "15px", paddingBottom: "5px" }}
              className="box text-center"
              pose={this.state.isVisible ? "visible" : "hidden"}
            >
              {" "}
              <button type="button" className="btn btn-raised btn-primary">
                {this.state.districtName}
              </button>
            </Box>
            <div className="container">
              <div
                className="row"
                style={{
                  paddingTop: "15px",
                  backgroundColor: "#DCDCDC",
                  paddingBottom: "15px"
                }}
              >
                <div className="col-sm-12 col-md-12 col-xl-6">
                  <div className="col-md-12" style={{ height: "260px" }}>
                    {this.state.lineChartView === "weekOverview" && (
                      <div className="container">
                        <div className="row">
                          <p
                            className="col-sm-12 text-center"
                            style={{
                              paddingTop: "4px",
                              paddingLeft: "5px",
                              fontSize: "13px",
                              fontWeight: "bold"
                            }}
                          >
                            Airbnb and Share Now history
                          </p>
                        </div>
                        <div className="row">
                          <p
                            className="col-sm-12 text-center"
                            style={{
                              paddingTop: "4px",
                              paddingLeft: "5px",
                              fontSize: "12px"
                            }}
                          >
                            Number of booked Airbnbs and Share Now cars per week
                          </p>
                        </div>
                        <LineDemo
                          airBnbData={this.state.airBnbData}
                          car2goData={this.state.car2goData}
                          labels={this.state.lineChartLabels}
                          height={null}
                          width={null}
                          options={{
                            aspectRatio: 1 // this would be a 1:1 aspect ratio
                          }}
                        />{" "}
                      </div>
                    )}
                    {this.state.lineChartView === "timeOverview" && (
                      <div className="container">
                        <div className="row">
                          <p
                            className="col-sm-12 text-center"
                            style={{
                              paddingTop: "4px",
                              paddingLeft: "5px",
                              fontSize: "13px",
                              fontWeight: "bold"
                            }}
                          >
                            Airbnb and Share Now history
                          </p>
                        </div>
                        <div className="row">
                          <p
                            className="col-sm-12 text-center"
                            style={{
                              paddingTop: "4px",
                              paddingLeft: "5px",
                              fontSize: "12px"
                            }}
                          >
                            Number of Share Now cars per day
                          </p>
                        </div>
                        <LineDemo
                          airBnbData={""}
                          car2goData={this.state.car2goData}
                          labels={this.state.lineChartLabels}
                          height={null}
                          width={null}
                          options={{
                            aspectRatio: 1 // this would be a 1:1 aspect ratio
                          }}
                        />{" "}
                      </div>
                    )}
                  </div>
                  <div className="col-md-12">
                    <MultiToggle
                      options={lineChartGroupOptions}
                      selectedOption={lineChartView}
                      onSelectOption={this.onLineChartViewSelect}
                    />
                  </div>
                </div>
                <div className="col-sm-12 col-md-12 col-xl-6 justify-content-center">
                  <div className="container">
                    <div className="row">
                      <p
                        className="col-sm-12 text-center"
                        style={{
                          paddingTop: "4px",
                          paddingLeft: "5px",
                          fontSize: "13px",
                          fontWeight: "bold"
                        }}
                      >
                        Airbnb and Share Now distribution
                      </p>
                    </div>
                    <div className="row">
                      <p
                        className="col-sm-12 text-center"
                        style={{
                          paddingTop: "4px",
                          paddingLeft: "5px",
                          fontSize: "12px"
                        }}
                      >
                        Distribution of Airbnbs and Share Now locations on{" "}
                        {this.state.queryDate}
                      </p>
                    </div>
                    <PieDemo
                      pieChartData={this.state.pieChartData}
                      height={null}
                      width={null}
                      options={{
                        aspectRatio: 1 // this would be a 1:1 aspect ratio
                      }}
                    />{" "}
                  </div>
                </div>
              </div>
              <div
                style={{
                  backgroundColor: "white",
                  height: "15px"
                }}
              ></div>
              <div
                className="row"
                style={{
                  backgroundColor: "#DCDCDC",
                  paddingTop: "15px"
                }}
              >
                <div className="col-sm-6 col-md-6 col-xl-6">
                  <div className="row h-100">
                    <div
                      className="col-sm-12 my-auto"
                      style={{ width: "100%" }}
                    >
                      <div
                        className="text-center"
                        style={{ paddingTop: "4px" }}
                      >
                        <div className="row">
                          <p
                            className="col-sm-12 text-center"
                            style={{
                              paddingTop: "4px",
                              paddingLeft: "5px",
                              fontSize: "13px",
                              fontWeight: "bold"
                            }}
                          >
                            Average availability
                          </p>
                        </div>
                        <p
                          className="col-sm-12 text-center"
                          style={{
                            paddingTop: "4px",
                            paddingLeft: "5px",
                            fontSize: "12px"
                          }}
                        >
                          The percentage of booked Airbnbs and average
                          availability of Share Now cars on{" "}
                          {this.state.queryDate}
                        </p>
                      </div>
                      <CustomBarChart
                        series={this.state.regionAirbnbSharenowAvailability}
                      ></CustomBarChart>{" "}
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="col-md-12" style={{ height: "425px" }}>
                    {this.state.treeView === "availability" && (
                      <div className="container">
                        <div className="row">
                          <p
                            className="col-sm-12 text-center"
                            style={{
                              paddingTop: "4px",
                              paddingLeft: "5px",
                              fontSize: "13px",
                              fontWeight: "bold"
                            }}
                          >
                            Availability comparison among the districts
                          </p>
                        </div>
                        <div className="row" style={{ paddingTop: "4px" }}>
                          <p
                            className="col-sm-12"
                            style={{
                              paddingTop: "4px",
                              paddingLeft: "5px",
                              fontSize: "12px"
                            }}
                          >
                            Average availability of Share Now cars for last
                            three months
                          </p>
                        </div>
                        <div className="row">
                          <div
                            className="col-sm-12 text-center"
                            style={{ paddingBottom: "15px" }}
                          >
                            <button
                              className="btn-primary"
                              style={{ fontSize: "12px" }}
                              onClick={() => this.toggleShow(true)}
                            >
                              Open Popup View
                            </button>
                          </div>
                        </div>
                        <div>
                          <PopPop
                            position="centerCenter"
                            open={show}
                            closeBtn={false}
                            closeOnEsc={true}
                            onClose={() => this.toggleShow(false)}
                            closeOnOverlay={true}
                          >
                            <div
                              className="col-md-12"
                              style={{ height: "300px", width: "850px" }}
                            >
                              <Tree
                                data={this.state.availabilityTreeData}
                                nodeSvgShape={svgSquare}
                                orientation={"vertical"}
                                separation={{ siblings: 2.3, nonSiblings: 1 }}
                                textLayout={this.state.textLayout}
                                translate={{ x: 330, y: 105 }}
                                zoom={0.8}
                              />{" "}
                            </div>
                          </PopPop>
                        </div>
                        <div className="col-md-12" style={{ height: "300px" }}>
                          <Tree
                            data={this.state.availabilityTreeData}
                            nodeSvgShape={svgSquare}
                            orientation={this.state.orientation}
                            separation={this.state.separation}
                            textLayout={this.state.textLayout}
                            translate={this.state.translate}
                            zoom={this.state.zoom}
                          />{" "}
                        </div>
                      </div>
                    )}
                    {this.state.treeView === "matrix" && (
                      <div className="container">
                        <div className="row">
                          <p
                            className="col-sm-12 text-center"
                            style={{
                              paddingTop: "4px",
                              paddingLeft: "5px",
                              fontSize: "13px",
                              fontWeight: "bold"
                            }}
                          >
                            Distribution of Share Now cars
                          </p>
                        </div>

                        <div className="row">
                          <p
                            className="col-sm-12 text-center"
                            style={{
                              paddingTop: "4px",
                              paddingLeft: "5px",
                              fontSize: "12px"
                            }}
                          >
                            Car distribution on {this.state.queryDate} at{" "}
                            {this.state.queryTime}:00
                          </p>
                        </div>
                        <div className="row">
                          <div
                            className="col-sm-12 text-center"
                            style={{ paddingBottom: "15px" }}
                          >
                            <button
                              className="btn-primary"
                              style={{ fontSize: "12px" }}
                              onClick={() => this.toggleShow(true)}
                            >
                              Open Popup View
                            </button>
                          </div>
                        </div>
                        <PopPop
                          position="centerCenter"
                          open={show}
                          closeBtn={false}
                          closeOnEsc={true}
                          onClose={() => this.toggleShow(false)}
                          closeOnOverlay={true}
                        >
                          <div
                            className="col-md-12"
                            style={{ height: "300px", width: "850px" }}
                          >
                            <Tree
                              data={this.state.matrixTreeData}
                              nodeSvgShape={svgSquare}
                              orientation={"vertical"}
                              separation={{ siblings: 1.6, nonSiblings: 1 }}
                              textLayout={this.state.textLayout}
                              translate={{ x: 350, y: 115 }}
                              zoom={0.6}
                            />{" "}
                          </div>
                        </PopPop>
                        <div className="col-md-12" style={{ height: "300px" }}>
                          <Tree
                            data={this.state.matrixTreeData}
                            nodeSvgShape={svgSquare}
                            orientation={this.state.orientation}
                            separation={this.state.separation}
                            textLayout={this.state.textLayout}
                            translate={this.state.translate}
                            zoom={this.state.zoom}
                          />{" "}
                        </div>
                      </div>
                    )}
                    {this.state.treeView === "barChart" && (
                      <div className="container">
                        <div className="row">
                          <p
                            className="col-sm-12 text-center"
                            style={{
                              paddingTop: "4px",
                              paddingLeft: "5px",
                              fontSize: "13px",
                              fontWeight: "bold"
                            }}
                          >
                            Availability comparison among the districts
                          </p>
                        </div>
                        <div className="row">
                          <p
                            className="col-sm-12 text-center"
                            style={{
                              paddingTop: "4px",
                              paddingLeft: "5px",
                              fontSize: "12px"
                            }}
                          >
                            Average availability of Share Now cars for last
                            three months
                          </p>
                        </div>
                        <BarChart
                          categories={this.state.categories}
                          series={this.state.series}
                        ></BarChart>
                      </div>
                    )}
                  </div>
                  <div
                    className="col-md-12"
                    style={{ paddingBottom: "8px", paddingTop: "8px" }}
                  >
                    <MultiToggle
                      options={groupOptions}
                      selectedOption={treeView}
                      onSelectOption={this.onTreeViewSelect}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-sm-6 col-md-6 col-xl-6">
            <div id="time-panel" style={{ width: "300px" }}>
              <DatePicker sendData={this.getDataFromDatePicker}></DatePicker>
              <div className="row" style={{ paddingTop: "15px" }}></div>
              <hr style={{ padding: "0px", margin: "Opx" }}></hr>
              <TimeSlider sendData={this.getDataFromTimeSlider}></TimeSlider>
              {this.state.isHovered === true && (
                <div>
                  <hr style={{ padding: "0px", margin: "Opx" }}></hr>
                  <div className="row">
                    <div className="col-md-12">
                      <p
                        style={{
                          paddingTop: "4px",
                          paddingLeft: "5px",
                          fontSize: "12px",
                          fontWeight: "bold"
                        }}
                      >
                        Region details
                      </p>
                    </div>
                    <div className="col-md-12" style={{ paddingTop: "4px" }}>
                      {" "}
                      <p
                        style={{
                          paddingLeft: "5px",
                          fontSize: "12px"
                        }}
                      >
                        Region name: {this.state.hoveredRegion}
                      </p>
                    </div>
                    <div className="col-md-12" style={{ paddingTop: "4px" }}>
                      <p
                        style={{
                          paddingLeft: "5px",
                          fontSize: "12px"
                        }}
                      >
                        Average availability: {this.state.objectH}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DeckGL
              initialViewState={initialViewState}
              controller={true}
              layers={layers}
            >
              <StaticMap
                mapboxApiAccessToken={MAPBOX_ACCESS_TOKEN}
                mapStyle="mapbox://styles/mapbox/streets-v11"
              />
            </DeckGL>
          </div>
        </div>
      </div>
    );
  }
}

export default Mapgl;
