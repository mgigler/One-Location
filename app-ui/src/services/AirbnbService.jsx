const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default class AirbnbService {
  static async getAirbnbRegionCount(location) {
    const response = await fetch(`${BACKEND_URL}/region_summary?months=1`, {
      method: "GET", // *GET, POST, PUT, DELETE, etc.
      mode: "cors", // no-cors, *cors, same-origin
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
        "Content-Type": "application/json"
      },
      redirect: "follow", // manual, *follow, error
      referrer: "no-referrer" // no-referrer, *client
    });

    const json = await response.json();
    const Airbnb = json.series.filter(entry => entry.name === location);
    let AirbnbCount = Airbnb[0].airbnbs[0];

    return AirbnbCount;
  }

  async getAirbnbData(date) {
    let airBnBLocations = [];
    const response = await fetch(`${BACKEND_URL}/airbnb_by_date?date=${date}`);

    const json = await response.json();

    json.airbnb_listings.map(entry => {
      airBnBLocations.push(entry);
      return null;
    });

    return airBnBLocations;
  }
}
