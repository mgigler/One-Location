import React from 'react';

import { makeStyles, withStyles } from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';

const ColorCircularProgress = withStyles({
  root: {
    color: '#ed553f',
  },
})(CircularProgress);

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
  },
  margin: {
    margin: theme.spacing(1),
  },
}));

export default function ProgressBar(props) {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <ColorCircularProgress size={props.size} thickness={props.thickness} />
    </div>
  );
}