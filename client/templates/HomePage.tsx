import * as React from 'react';
import { withAuth, AuthInjectedProps } from '../js/stores/Auth';
import { withRouter, RouteComponentProps } from 'react-router';

type Props = AuthInjectedProps & RouteComponentProps<any>;

class HomePage extends React.PureComponent<Props> {
  render() {
    // const { user } = this.props;

    return (
      <div>
        <h1>Hello world</h1>
      </div>
    );
  }
}

export default withRouter(withAuth(HomePage));
