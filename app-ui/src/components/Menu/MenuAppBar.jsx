import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Grid from '@material-ui/core/Grid';
import { Link } from 'react-router-dom'
import theme from '../../design/theme';

const useStyles = makeStyles(theme => ({
    root: {
        flexGrow: 1
    },
    title: {
        flexGrow: 1,
    },
    logo: {
        [theme.breakpoints.up("xs")]: {
            width:125
        },
        [theme.breakpoints.down("xs")]: {
            width:50,
            paddingLeft:20
        }
    },
    menu: {
        [theme.breakpoints.down("xs")]: {
            justifyContent: "center"
        }},

        navElement : {
            [theme.breakpoints.up("xs")]: {
                marginLeft:"20px"
            },
            [theme.breakpoints.down("xs")]: {
                marginLeft:"0px",
                paddingLeft:"0px",
                justifyContent: "center",
                flexDirection:"column",
                alignContent:"center",
                alignItems:"center",
                fontSize:10
            }    
        }
        
    
}));

export default function MenuAppBar() {
    const classes = useStyles();

    return (
        <div className={classes.root}>
            <AppBar position="static">
                <Toolbar style={{ backgroundColor: "#FFFFFF", paddingBottom:"10px", paddingTop:"10px" }}>
                    <Grid container justify="flex-start" alignItems="center" alignContent="center" spacing={1}>
                        <Grid item xs={12} sm={2}>
                        <Grid container justify="center">
                            <Grid item>
                            <Link to="/"><img className={classes.logo} alt={"Joy of Sharing"} src="/oneposition.png" /></Link>
                            </Grid>
                        </Grid>
                         
                        </Grid>
                        <Grid item xs={12} sm={8} >

                            <Grid container justify="flex-start" spacing={3} className={classes.navElement}>
                                
                                <Grid item >
                                    <Link to={"/map"} style={{ color: theme.palette.primary.light }}>
                                        Map
                                        </Link>
                                </Grid>
                                <Grid item>

                                    <Link to={"/pricecalculator"} style={{ color: theme.palette.primary.light }}>
                                        Price Calculator
                                        </Link>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </Toolbar>
            </AppBar>
        </div >
    );
}