import React from 'react';

import { withStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Tooltip from '@material-ui/core/Tooltip';
import HelpIcon from '@material-ui/icons/Help';

import Manual from './Manual';

const styles = theme => ({
  root: {
    padding: theme.spacing(2),
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: '#ed553f',
  },
});

const DialogTitle = withStyles(styles)(props => {
  const { children, classes, onClose, ...other } = props;
  return (
    <MuiDialogTitle disableTypography className={classes.root}>
        <IconButton aria-label="close" className={classes.closeButton} onClick={onClose}>
          <CloseIcon />
        </IconButton>
    </MuiDialogTitle>
  );
});

const DialogContent = withStyles(theme => ({
  root: {
    padding: theme.spacing(2),
  },
}))(MuiDialogContent);

export default function HelpDialog(props) {
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <Tooltip key="HelpButton" title="Display Help" aria-label="help">
        <HelpIcon onClick={handleClickOpen} />
      </Tooltip>
      <Dialog key="r" onClose={handleClose} aria-labelledby="customized-dialog-title" open={open}>
        <DialogTitle id="dialog-title" onClose={handleClose}/>
        <DialogContent>
          <Manual handleActiveStep={props.handleActiveStep} activeStep={props.activeStep} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
