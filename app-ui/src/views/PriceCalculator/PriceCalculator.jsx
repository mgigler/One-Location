import React from "react";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";

import PriceHeader from "../../components/PriceCalculator/PriceHeader";
import MatrixService from "../../services/MatrixService";

import PriceTable from "../../components/PriceCalculator/Table/PriceTable";
import PriceTableController from "../../components/PriceCalculator/Table/PriceTableController";

class PriceCalculator extends React.Component {

  constructor(props) {
    super(props);
    this.state = { districts: [], filteredDistricts: [], priceTableOpen:false, filterValue:"" };
    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.togglePriceTableOpen = this.togglePriceTableOpen.bind(this);
  }

  async componentDidMount() {
    let service = new MatrixService();
    let json = await service.getData();
    this.setState({ districts: json, filteredDistricts: json });
  }

  handleSearchChange(search) {
    if (search === "") {
      this.setState({ filteredDistricts: this.state.districts, filterValue:"" });
    }
    else {
      let filteredData = this.state.districts.filter(entry =>
        entry.name.toLowerCase() === (search.toLowerCase())
      );
      this.setState({ filteredDistricts: filteredData, filterValue:search });
    }
  }

  togglePriceTableOpen()
  {
    this.setState({ priceTableOpen: !this.state.priceTableOpen })
  }

  render() {
    return (
        <Paper style={{ padding: "5%" }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={12}>
              <PriceHeader data={this.state.districts} />
            </Grid>
            <Grid item xs={12} sm={12}>
              <PriceTableController priceTableOpen={this.state.priceTableOpen} toggle={this.togglePriceTableOpen}/>
              <PriceTable filterValue= {this.state.filterValue} priceTableOpen={this.state.priceTableOpen}  originalData={this.state.districts} filteredData={this.state.filteredDistricts} handleSearchChange={this.handleSearchChange} />
            </Grid>
          </Grid>
        </Paper>
    );
  }
}

export default PriceCalculator;
