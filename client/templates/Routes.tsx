import * as React from 'react';
import { Route, Switch } from 'react-router';

import HomePage from './HomePage';
import { Location } from 'history';

export type Props = { location: Location };

export default class Routes extends React.PureComponent<Props> {
  render() {
    return (
      <React.Fragment>
        <Switch>
          <Route exact path="/" component={HomePage} />
          <Route path="/index" component={HomePage} />

          {/* 404 fall-through */}
          <Route path="*" component={HomePage} />
        </Switch>
      </React.Fragment>
    );
  }
}
