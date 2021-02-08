import axios from "axios";
import moment from "moment";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default class RegionService {
  async getData(date, time) {
    try {
      let queryString = "date=" + date + "&time=" + time;

      const response = await fetch(`${BACKEND_URL}/regions?${queryString}`);
      const json = await response.json();
      return json;
    } catch (e) {}
  }

  async getRegionCarDistData(region, date, time) {
    try {
      let queryString = "region=" + region + "&date=" + date + "&time=" + time;

      const response = await fetch(`${BACKEND_URL}/matrix_tree?${queryString}`);

      const json = await response.json();

      const matrixTreeData = {
        name: region,
        attributes: {
          "# of Cars": json.no_cars
        },
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
      console.log(matrixTreeData);
      return matrixTreeData;
    } catch (e) {}
  }

  constructChildren(json) {
    let childrenArray = [];
    let child = {};

    json.series.map(entry => {
      child = {
        attributes: {
          "# of Cars": entry.data[0]
        }
      };
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

      childrenArray.push(child);
      return null;
    });

    return childrenArray;
  }

  getRegionAirbnbSharenowNumbers = async (lastDate, region, timeOnly) => {
    try {
      let queryString = "";

      let firstDate = moment(lastDate)
        .subtract(7, "d")
        .format("YYYY-MM-DD");

      if (timeOnly === true) {
        if (region === "Munich") {
          queryString =
            "first_date=" +
            lastDate +
            "&last_date=" +
            lastDate +
            "&first_hour=0&last_hour=23&time_only";
        } else {
          queryString =
            "first_date=" +
            lastDate +
            "&last_date=" +
            lastDate +
            "&region=" +
            region +
            "&first_hour=0&last_hour=23&time_only";
        }
      } else {
        if (region === "Munich") {
          queryString = "first_date=" + firstDate + "&last_date=" + lastDate;
        } else {
          queryString =
            "first_date=" +
            firstDate +
            "&last_date=" +
            lastDate +
            "&region=" +
            region;
        }
      }

      let res = await axios.get(
        `${BACKEND_URL}/airbnb_sharenow_number?${queryString}`
      );

      let data = res.data;

      return data;
    } catch (e) {}
  };

  getRegionAirbnbSharenowNumbersforPieChart = async (lastDate, region) => {
    try {
      let queryString = "";

      let firstDate = moment(lastDate)
        .subtract(7, "d")
        .format("YYYY-MM-DD");

      if (region === "Munich") {
        queryString = "first_date=" + firstDate + "&last_date=" + lastDate;
      } else {
        queryString =
          "first_date=" +
          firstDate +
          "&last_date=" +
          lastDate +
          "&region=" +
          region;
      }

      let res = await axios.get(
        `${BACKEND_URL}/airbnb_sharenow_number?${queryString}`
      );

      let data = res.data;

      return data;
    } catch (e) {}
  };
}
