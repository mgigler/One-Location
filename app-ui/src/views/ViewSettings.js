import posed from "react-pose";

const MAPBOX_ACCESS_TOKEN = process.env.REACT_APP_MAPBOXTOKEN;

const groupOptions = [
  {
    displayName: "Availability Tree",
    value: "availability"
  },
  {
    displayName: "Matrix Tree",
    value: "matrix"
  },
  {
    displayName: "Availability Chart",
    value: "barChart"
  }
];

const lineChartGroupOptions = [
  {
    displayName: "Week Overview",
    value: "weekOverview"
  },
  {
    displayName: "Day Overview",
    value: "timeOverview"
  }
];


const svgSquare = {
  shape: "rect",
  shapeProps: {
    fill: "#36A2EB",
    width: 20,
    height: 20,
    x: -15,
    y: -10
  }
};

const Box = posed.div({
  visible: {
    opacity: 1,
    transition: {
      duration: 400,
      ease: "linear"
    }
  },
  hidden: { opacity: 0 }
});

// Initial viewport settings
const initialViewState = {
  longitude: 11.576124,
  latitude: 48.137154,
  zoom: 11,
  pitch: 0,
  bearing: 0
};

export { MAPBOX_ACCESS_TOKEN, groupOptions, lineChartGroupOptions, svgSquare, Box, initialViewState };
