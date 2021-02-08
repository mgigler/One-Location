import React from 'react';

import 'rc-datetime-picker/dist/picker.css';

import DialogTitle from '@material-ui/core/DialogTitle';
import Grid from "@material-ui/core/Grid";
import Table from "@material-ui/core/Table";
import { TableBody, Typography } from '@material-ui/core';
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import Avatar from "@material-ui/core/Avatar";
import EventIcon from '@material-ui/icons/Event';

const title = "The value for time and date has been changed."

export default function DateConfirmationDialog(props) {

  return (
    <React.Fragment>
      <DialogTitle>{title}</DialogTitle>

      <Grid container justify="center" alignContent="center" alignItems="center" >
        <Grid item sm={2} xs={12} style={{ textAlign: "center" }} >
          <Grid
            container
            spacing={0}
            direction="column"
            alignItems="center"
            justify="center"
          >
            <Avatar style={{backgroundImage: 'linear-gradient( 95deg,rgb(242,113,33) 0%,rgb(233,64,87) 50%,rgb(138,35,135) 100%)'}}>
              <EventIcon />
            </Avatar>
          </Grid>
        </Grid>
        <Grid item sm={10} xs={12}>
            <Typography style={{padding:"10px"}}>
              Should the dynamic price be recalculated?
          </Typography>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>
                  Old Value
                  </TableCell>
                <TableCell>
                  {props.initialDate.format("DD.MM.YYYY")}, {props.initialDate.format("HH:mm ")}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  New Value
                  </TableCell>
                <TableCell>
                  {props.proposedDate.format("DD.MM.YYYY")}, {props.proposedDate.format("HH:mm ")}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Grid>
      </Grid>

    </React.Fragment >);
}