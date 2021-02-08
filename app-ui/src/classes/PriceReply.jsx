export default class PriceReply {
    constructor() {
        this.dateTime = "";

        this.from = "";
        this.to = "";


        this.distance = "";
        this.duration = "";

        this.sharenowIncluded = "";
        this.sharenowDuration = "";
        this.sharenowPrice = "";

        this.airbnbIncluded = false;
        this.airbnbFromCount = "";
        this.airbnbToCount = "";
        this.startOccupancyRate="";
        this.destinationOccupancyRate="";
        this.startExistingAirbnbs ="";    
        this.destinationExistingAirbnbs =""; 
        

        this.availabilityIncluded = false;
        this.availabilityStart = "";
        this.availabilityDestination = "";
        this.availabilityProvision = "";

        this.publicTransportIncluded = false;
        this.publicTransportCosts = "";
        this.publicTransportDuration = "";

        this.ModalSplitIncluded = false;
        this.ModalSplitCar = "";
        this.ModalSplitMvv = "";
        this.ModalSplitBike = "";
        this.ModalSplitPrice = "";

        this.taxiIncluded = false;
        this.taxiCosts = "";
        this.taxiDuration = "";

        this.trafficIncluded = false;
        this.trafficLevelGeneral = "";
        this.trafficCongestionSevere = "";
        this.trafficCongestionHeavy = "";
        this.trafficCongestionModerate = "";
        this.trafficCongestionLow = "";
        this.trafficCongestionUnknown = "";


        this.weatherIncluded = false;
        this.weatherCondition = "";
        this.weatherTemperature = "";
        this.wind = "";
        this.precipitation = "";


        this.calculateTrafficeLevelGeneral = () => {

            const weightedSum = 4 * this.trafficCongestionSevere + 3 * this.trafficCongestionHeavy + 2 * this.trafficCongestionModerate + 1 * this.trafficCongestionLow;
            const sum = this.trafficCongestionSevere + this.trafficCongestionHeavy + this.trafficCongestionModerate + this.trafficCongestionLow;
            if (sum === 0) {
                this.trafficLevelGeneral = "N/A";
            }
            else {
                this.trafficLevelGeneral = Number(weightedSum / sum).toFixed(2);
            }
        }
    }
}

