import District from "../classes/District";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

class MatrixService {
  constructor() {
    this.districts = [];
  }

  //Returns MatrixData
  async getData() {
    if (this.districts.length === 0) {
      let returnValues = [];

      const response = await fetch(`${BACKEND_URL}/dynamic-price-matrix`);
      const json = await response.json();

      let districts = json.districts;
      let matrix = json.matrix;

      await districts.map((district, index) => {
        returnValues.push(new District(index, district, matrix[index]));
        return returnValues;
      });

      this.districts = returnValues;
      return returnValues;
    }
  }

  static getIdMatrix(id, data) {
    let filterDistances = [];
    data.map((district, i) => {
      let name = district.name;
      let value = district.values[id];
      let index = district.index;
      filterDistances[i] = { index, name, value };
      return 1;
    });

    return filterDistances
      .sort(function(a, b) {
        return b.value - a.value;
      })
      .slice(1, 10);
  }
}
export default MatrixService;
