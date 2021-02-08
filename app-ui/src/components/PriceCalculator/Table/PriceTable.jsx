import React from "react";

import ResponsiveTable from "./ResponsiveTable"

export default class PriceTable extends React.Component {
  constructor(props) {
    super(props);
    this.createHeader = this.createHeader.bind(this);
    this.createData = this.createData.bind(this);
    this.handleSearchChange = this.handleSearchChange.bind(this);
  }

  handleSearchChange(event, value) {

    console.log("Search Value");
    console.log(value);
    let searchValue = "";
    if (value !== null || !typeof value === undefined) {
      if (value.name !== null || !typeof value.name === undefined) {
        searchValue = value.name
      }
      else {
        searchValue = ""
      }

    }
    this.props.handleSearchChange(searchValue);
  }

  createColumn(id, name) {
    return {
      id: id,
      Header: name,
      Cell: row => (
        <div style={{ textAlign: "right" }}>{row.value}</div>
      ),
      accessor: String(id),
      width: 300
    };
  }

  createHeader(data) {
    let returnHeader = [];
    let districtColumns = [];
    data.map(district => {
      districtColumns.push(this.createColumn(district.index, district.name));
      return 1;
    });

    returnHeader.push({
      Header: "From/To",
      fixed: "left",
      columns: [
        {
          Header: "District",
          accessor: "district",
          width: 300
        }
      ]
    });
    returnHeader.push({
      Header: "To",
      columns: districtColumns
    });

    return returnHeader;
  }

  createData(data) {
    let districtData = [];

    districtData = [];

    data.map(district => {
      let districtObject = {};
      districtObject.district = district.name;
      district.values.map((distance, index) => {
        districtObject[String(index)] = String(Number(distance).toFixed(2)).concat(" €");
        return 1;
      });
      districtData.push(districtObject);
      return 1;
    });

    return districtData;
  }

  render() {
    if (!this.props.priceTableOpen) { return (<React.Fragment></React.Fragment>) }
    else if (
      this.props.originalData.length === 0
    ) {
      return <p>Loading</p>;
    } else {

      const headerColumns = this.createHeader(this.props.originalData);
      const data = this.createData(this.props.filteredData);

      return (

        <React.Fragment>
          {this.props.filteredData.length  === 0 && <ResponsiveTable value={this.props.filterValue} label="Select a  district" options={this.props.originalData} onChange={this.handleSearchChange}
            data={data}
            columns={headerColumns}
            pageSize={0} />}
          {this.props.filteredData.length  === 1 && <ResponsiveTable value={this.props.filterValue} label="Select a  district" options={this.props.originalData} onChange={this.handleSearchChange}
            data={data}
            columns={headerColumns}
            pageSize={1} />}
          {this.props.filteredData.length > 1  && <ResponsiveTable value={this.props.filterValue} label="Select a  district" options={this.props.originalData} onChange={this.handleSearchChange}
            data={data}
            columns={headerColumns}
            pageSize={10} />}
        </React.Fragment>
      );
    }
  }
}
