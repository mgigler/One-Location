import React from 'react';
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';

export default function DistrictAutoComplete(props) {

  const convert = (data) => {
    let returnData = [];
    data.map((district) => {
      returnData.push({ "name": district.name });
      return 1;
    });
    return returnData;
  }

  const determineValue = (value) => {
    if (value === undefined) {
      return { "name": "" };
    }
    else {
      return{ "name": value };
    }
  }
  return (
    <Autocomplete
      value={determineValue(props.value)}
      id="combo-box"
      autoComplete
      autoHighlight
      autoSelect
      options={convert(props.options)}
      getOptionLabel={option => option.name}
      onChange={props.onChange}
      style={{ marginTop: "30px" }}
      renderInput={params => (
        <TextField {...params} label={props.label} variant="outlined" fullWidth />
      )}
    />
  );
}