import React from 'react';

import PropTypes from 'prop-types';
import clsx from 'clsx';

import { makeStyles, withStyles } from '@material-ui/core/styles';

import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import EventIcon from '@material-ui/icons/Event';
import StepConnector from '@material-ui/core/StepConnector';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFlagCheckered } from '@fortawesome/free-solid-svg-icons'
import { faDatabase } from '@fortawesome/free-solid-svg-icons'

const ColorlibConnector = withStyles({
  alternativeLabel: {
    top: 22,
  },
  active: {
    '& $line': {
      backgroundImage:
        'linear-gradient( 95deg,rgb(242,113,33) 0%,rgb(233,64,87) 50%,rgb(138,35,135) 100%)',
    },
  },
  completed: {
    '& $line': {
      backgroundImage:
        'linear-gradient( 95deg,rgb(242,113,33) 0%,rgb(233,64,87) 50%,rgb(138,35,135) 100%)',
    },
  },
  line: {
    height: 3,
    border: 0,
    backgroundColor: '#eaeaf0',
    borderRadius: 1,
  },
})(StepConnector);

const useColorlibStepIconStyles = makeStyles({
  root: {
    backgroundColor: '#ccc',
    zIndex: 1,
    color: '#fff',
    width: 50,
    height: 50,
    display: 'flex',
    borderRadius: '50%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  active: {
    backgroundImage:
      'linear-gradient( 136deg, rgb(242,113,33) 0%, rgb(233,64,87) 50%, rgb(138,35,135) 100%)',
    boxShadow: '0 4px 10px 0 rgba(0,0,0,.25)',
  },
  completed: {
    backgroundImage:
      'linear-gradient( 136deg, rgb(242,113,33) 0%, rgb(233,64,87) 50%, rgb(138,35,135) 100%)',
  },
});

function ColorlibStepIcon(props) {
  const classes = useColorlibStepIconStyles();
  const { active, completed } = props;

  const icons = {
    1: <FontAwesomeIcon id={0} icon={faFlagCheckered} />,
    2: <FontAwesomeIcon id={1} icon={faDatabase} />,
    3: <EventIcon id={2}/>,
  };

  return (
    <div
      className={clsx(classes.root, {
        [classes.active]: active,
        [classes.completed]: completed,
      })}
    >
      {icons[String(props.icon)]}
    </div>
  );
}

ColorlibStepIcon.propTypes = {
  active: PropTypes.bool,
  completed: PropTypes.bool,
  icon: PropTypes.node,
};

const useStyles = makeStyles(theme => ({
  root: {
    width: '100%',
  },
  button: {
    marginRight: theme.spacing(1),
  },
  instructions: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
}));

export default function PriceHeaderStepper(props) {
  const classes = useStyles();
  const onLabelClick = (event) => {
    if (event.target.innerHTML.includes("flag-checkered")|| event.target.innerHTML === "Origin and Destination"||event.target.parentNode.id==="0" || event.target.classList.value.includes("flag-checkered"))
    {
      props.setActiveStep(0);
    }
    else {
      if (event.target.innerHTML.includes("database") || event.target.innerHTML === "Data Sources"||event.target.parentNode.id==="1"|| event.target.classList.value.includes("fa-database")) {
        props.setActiveStep(1);
      }
      else{
        if (event.target.innerHTML.includes("MuiSvgIcon-root") || event.target.innerHTML === "Date and Time"||event.target.parentNode.id==="2"||  event.target.classList.value.includes("MuiSvgIcon-root")) {
          props.setActiveStep(2);
        }
      }
    }
  }

  return (
    <div className={classes.root}>
      <Stepper alternativeLabel activeStep={props.activeStep} connector={<ColorlibConnector />}>
        {props.steps.map(step => (
          <Step id={step.index} key={step.text}>
            <StepLabel id={step.index} StepIconComponent={ColorlibStepIcon} onClick={onLabelClick}>{step.text}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </div>
  );
}
