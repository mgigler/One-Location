import React from 'react';

import FormControl from '@material-ui/core/FormControl';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Grid from "@material-ui/core/Grid";

import DistrictChexbox from './DistrictCheckbox';

export default class DistrictCheckboxes extends React.Component {
    constructor(props) {
        super(props);
        this.state = { mvg: false, weather: false, airbnb: false }
        this.toggleCheckbox = this.toggleCheckbox.bind(this);
    }

    toggleCheckbox(event) {
        this.props.handleChange(event.target.name, event.target.checked);
    }

    render() {
        return (    
            <FormControl component="fieldset" style={{ width: "100%" }}>
                <FormGroup>
                    <Grid container spacing={2} justify="space-evenly" >

                        {this.props.options.map((option, index) =>
                            <React.Fragment key={"DistrictChexbox".concat(index).concat("Fragment")}>
                                {index % 2 === 0 && <Grid item sm={2} xs={false} />}
                                <Grid item sm={4} xs={12} align="left">
                                    <FormControlLabel key={"DistrictChexbox".concat(index)}
                                        control={<DistrictChexbox name={option.name} checked={option.value} onChange={this.toggleCheckbox} />}
                                        label={option.name}
                                    />  </Grid>
                                {index % 2 === 0 && <Grid item sm={1} xs={false} />}
                            </React.Fragment>)
                        }
                    </Grid>
                </FormGroup>
            </FormControl>);
    }
}