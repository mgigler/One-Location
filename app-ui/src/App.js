import React from "react";
import withRoot from "./design/withRoot";
import { BrowserRouter as Router, Route, Switch, Redirect } from "react-router-dom";

import MenuAppBar from "./components/Menu/MenuAppBar";

import Home from "./views/Home/Home";
import PriceCalculator from "./views/PriceCalculator/PriceCalculator";
import Mapgl from "./views/Map/Mapgl";

class App extends React.Component {
  constructor(props) {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      console.log("api: " + BACKEND_URL);
    super(props);
  }
  render() {
    return (
      <Router>
        <Switch>
          <Route
            exact={true}
            path="/pricecalculator"
            render={props => (
              <React.Fragment>
                <MenuAppBar />
                <PriceCalculator />
              </React.Fragment>
            )}
          />
          <Route
            exact={true}
            path="/map"
            render={props => (
              <React.Fragment>
                <MenuAppBar />
                <Mapgl />
              </React.Fragment>
            )}
          />
          <Route
            exact={true}
            path="/"
            render={props => (
              <React.Fragment>
                <MenuAppBar />
                <Home />
              </React.Fragment>
            )}
          />
            <Route
            exact={false}
            path="/"
            render={props => (
              <Redirect to="/"/>
            )}
          />
        </Switch>
      </Router>
    );
  }
}

export default withRoot(App);
