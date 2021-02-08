import React from 'react';
import moment from 'moment';
import { DatetimePicker } from 'rc-datetime-picker';
import '../../../styles/DateTimePicker.css'

import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DateConfirmationDialog from './DateConfirmationDialog'

export default function DistrictDateTimePicker(props) {
  const initialDate = props.date;
  const [lastDisplayProposedDate, setlastDisplayProposedDate] = React.useState("");
  const [proposedDate, setProposedDate] = React.useState(props.date)
  const [open, setOpen] = React.useState(false);


  const handleClickOpen = () => {
    if (initialDate !== proposedDate && proposedDate !== lastDisplayProposedDate) {
      if(props.priceCalculated){
        setOpen(true);
        setlastDisplayProposedDate(proposedDate);
      }
      else {
        props.handleChange(proposedDate);
      }
    }
  };

  const changeProposedDate = (moment) => {
    setProposedDate(moment);
  }

  const propagateChanges = () => {
    if (proposedDate !== initialDate) {
      props.handleChange(proposedDate);
      handleClose();
    }
  }

  const resetChanges = () => {
    setProposedDate(initialDate);
    setOpen(false);
  };

  const handleClose = () => {
    setOpen(false);
  };


  return (
    <div onMouseLeave={handleClickOpen}>
      <DatetimePicker
        moment={proposedDate}
        onChange={changeProposedDate}
      />

      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
       <DateConfirmationDialog initialDate={initialDate} proposedDate={proposedDate}/>
        <DialogActions>
          <Button onClick={propagateChanges} color="primary">
            Confirm
          </Button>
          <Button onClick={handleClose} color="primary" autoFocus>
            Cancel
          </Button>
          <Button onClick={resetChanges} color="primary" autoFocus>
            Reset
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
