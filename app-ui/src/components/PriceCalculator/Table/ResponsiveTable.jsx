import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

import DistrictAutoComplete from "../Stepper/OriginDestination/DistrictAutoComplete";
import ReactTable from "react-table";
import "react-table/react-table.css";
import withFixedColumns from "react-table-hoc-fixed-columns";
import "react-table-hoc-fixed-columns/lib/styles.css";

const ReactTableFixedColumns = withFixedColumns(ReactTable);

const useStyles = makeStyles(theme => ({
    responsiveTable: {
        [theme.breakpoints.down("xs")]: {
            display: "none"
        }
    }
}));

export default function ResponsiveTable(props) {
    const classes = useStyles();

    return (
        <React.Fragment>
            <div className={classes.responsiveTable}>
                <DistrictAutoComplete value={props.value} label="Select a  district" options={props.options} onChange={props.onChange} />
                <ReactTableFixedColumns
                    data={props.data}
                    columns={props.columns}
                    style={{ marginTop: "10px", height: 500, textAlign: "center", display: "block" }}
                    className="-striped -highlight"
                    defaultPageSize={props.pageSize}
                />
            </div>
        </React.Fragment>
    );
}