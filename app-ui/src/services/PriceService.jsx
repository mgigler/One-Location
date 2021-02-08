import PriceRequest from "../classes/PriceRequest";
import PriceReply from "../classes/PriceReply";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default class PriceService {
  static priceFactorsUrl() {
    return `${BACKEND_URL}/price-factors`;
  }

  static async getPrice(priceRequest) {
    if (priceRequest instanceof PriceRequest) {
      //Determining the Values of the checkBoxOptions of the PriceRequest
      const airbnb = priceRequest.checkBoxOptions.filter(entry =>
        entry.name.toLowerCase().includes("airbnb")
      )[0].value;
      const availability = priceRequest.checkBoxOptions.filter(entry =>
        entry.name.toLowerCase().includes("availability")
      )[0].value;
      const mvv = priceRequest.checkBoxOptions.filter(entry =>
        entry.name.toLowerCase().includes("public")
      )[0].value;
      const taxi = priceRequest.checkBoxOptions.filter(entry =>
        entry.name.toLowerCase().includes("taxi")
      )[0].value;
      const traffic = priceRequest.checkBoxOptions.filter(entry =>
        entry.name.toLowerCase().includes("traffic")
      )[0].value;
      const weather = priceRequest.checkBoxOptions.filter(entry =>
        entry.name.toLowerCase().includes("weather")
      )[0].value;
      const dateTime = priceRequest.dateTime.toJSON();

      //Assembling the Request String
      const data = {
        from: priceRequest.from,
        to: priceRequest.to,
        date: dateTime,
        checkboxOptions: {
          airbnb: airbnb,
          availability: availability,
          mvv: mvv,
          taxi: taxi,
          traffic: traffic,
          weather: weather
        }
      };
      const response = await fetch(this.priceFactorsUrl(), {
        method: "POST",
        mode: "cors",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        redirect: "follow",
        referrer: "no-referrer",
        body: JSON.stringify(data)
      });

      const json = await response.json();

      let priceReply = new PriceReply();

      //Setting general Information for the PriceReply

      priceReply.sharenowIncluded = true;
      priceReply.sharenowPrice = Number(json.sharenow).toFixed(2);
      priceReply.sharenowDuration = json.duration;

      priceReply.price = Number(json.price).toFixed(2);
      priceReply.distance = json.distance;
      priceReply.duration = json.duration;

      priceReply.dateTime = priceRequest.dateTime;
      priceReply.from = priceRequest.from;
      priceReply.to = priceRequest.to;

      //Setting definable Information for the PriceReply

      if (airbnb === true) {
        priceReply.airbnbIncluded = true;
        priceReply.airbnbFromCount = json.airbnb.start_booked_airbnbs;
        priceReply.airbnbToCount = json.airbnb.destination_booked_airbnbs;
        priceReply.startExistingAirbnbs = json.airbnb.start_existing_airbnbs;
        priceReply.destinationExistingAirbnbs =
          json.airbnb.destination_existing_airbnbs;
        priceReply.startOccupancyRate = Number(
          json.airbnb.start_occupancy_rate * 100
        ).toFixed(0);
        priceReply.destinationOccupancyRate = Number(
          json.airbnb.destination_occupancy_rate * 100
        ).toFixed(0);
      }

      if (availability === true) {
        priceReply.availabilityIncluded = true;
        priceReply.availabilityStart = (
          Number(json.availability.start_availability) * 100
        ).toFixed(0);
        priceReply.availabilityDestination = (
          Number(json.availability.destination_availability) * 100
        ).toFixed(0);
        priceReply.availabilityProvision = Number(
          json.availability.provision
        ).toFixed(2);
      }

      if (mvv === true) {
        priceReply.publicTransportIncluded = mvv;

        priceReply.ModalSplitCar = (Number(json.modalSplit.car)*100).toFixed()
        priceReply.ModalSplitMvv = (Number(json.modalSplit.mvv)*100).toFixed()
        priceReply.ModalSplitBike = (Number(json.modalSplit.bike)*100).toFixed()
        priceReply.ModalSplitPrice = Number(json.modalSplit.optimal_price)
        priceReply.ModalSplitOptimalCar = (Number(json.modalSplit.optimal_car)*100).toFixed()
        priceReply.ModalSplitOptimalMvv = (Number(json.modalSplit.optimal_mvv)*100).toFixed()
        priceReply.ModalSplitOptimalBike = (Number(json.modalSplit.optimal_bike)*100).toFixed()

        if (json.mvv === null) {
          priceReply.publicTransportDuration = "N/A";
          priceReply.publicTransportCosts = "N/A";
        } else {
          priceReply.publicTransportDuration = String(json.mvv.duration).concat(
            " Min."
          );
          priceReply.publicTransportCosts = Number(json.mvv.price)
            .toFixed(2)
            .concat(" €");
        }
      }

      if (taxi === true) {
        priceReply.taxiIncluded = true;
        priceReply.taxiCosts = Number(json.taxi).toFixed(2);
        priceReply.taxiDuration = json.duration;
      }

      if (traffic === true) {
        priceReply.trafficIncluded = true;
        priceReply.trafficCongestionSevere = json.congestion.severe;
        priceReply.trafficCongestionHeavy = json.congestion.heavy;
        priceReply.trafficCongestionModerate = json.congestion.moderate;
        priceReply.trafficCongestionLow = json.congestion.low;
        priceReply.trafficCongestionUnknown = json.congestion.unknown;
        priceReply.calculateTrafficeLevelGeneral();
      }

      if (weather === true) {
        priceReply.weatherIncluded = true;
        if (json.weather === null) {
          priceReply.weatherTemperature = "N/A";
          priceReply.weatherCondition = "N/A";
          priceReply.wind = "N/A";
          priceReply.precipitation = "N/A";
        } else {
          priceReply.weatherTemperature = String(json.weather.temp).concat(
            " °C"
          );
          priceReply.weatherCondition = json.weather.condition;
          priceReply.wind = json.weather.wind.description;
          priceReply.precipitation = String(json.weather.precipitation).concat(
            " ml"
          );
        }
      }

      return priceReply;
    }
  }
}
