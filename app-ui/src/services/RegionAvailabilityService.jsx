import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default class RegionAvailabilityService {
  async getData(region, months) {
    try {
      let queryString = "";

      if (region === "Munich") {
        queryString = "&months=" + months;
      } else {
        queryString = "region=" + region + "&months=" + months;
      }

      const response = await fetch(
        `${BACKEND_URL}/region_availability?${queryString}`
      );
      const json = await response.json();

      return json;
    } catch (e) {}
  }

  async getTreeData(region, months) {
    try {
      let queryString = "";

      if (region === "Munich") {
        queryString = "&months=" + months;
      } else {
        queryString = "region=" + region + "&months=" + months;
      }

      const response = await fetch(
        `${BACKEND_URL}/region_availability?${queryString}`
      );

      const json = await response.json();

      const availabilityTreeData = {
        name: region,
        children: this.constructChildren(json),
        nodeSvgShape: {
          shape: "rect",
          shapeProps: {
            fill: "green",
            width: 20,
            height: 20,
            x: -10,
            y: -10
          }
        }
      };
      return availabilityTreeData;
    } catch (e) {}
  }

  constructChildren(json) {
    let childrenArray = [];
    let child = {};

    json.series.map(entry => {
      var month1 = "Avarage Availability for " + json.xaxis[0];
      var month2 = "Avarage Availability for " + json.xaxis[1];
      var month3 = "Avarage Availability for " + json.xaxis[2];

      let monthString = {};
      monthString[month1] = entry.data[0];
      monthString[month2] = entry.data[1];
      monthString[month3] = entry.data[2];

      child = {};
      child["name"] = entry.name;
      child["nodeSvgShape"] = {
        shape: "rect",
        shapeProps: {
          fill: "red",
          width: 20,
          height: 20,
          x: -10,
          y: -10
        }
      };
      child["attributes"] = monthString;

      childrenArray.push(child);
      return null;
    });

    return childrenArray;
  }

  getRegionAirbnbSharenowAvailability = async (date, region) => {
    try {
      let queryString = "";
      let series = {
        data: []
      };
      if (region === "Munich") {
        queryString = "date=" + date;
      } else {
        queryString = "date=" + date + "&region=" + region;
      }

      let res = await axios.get(
        `${BACKEND_URL}/airbnb_sharenow_availability?${queryString}`
      );

      series.data.push(res.data.booked_airbnb_percentage);
      series.data.push(res.data.booked_sharenow_percentage);

      return series;
    } catch (e) {}
  };
}
