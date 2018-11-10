import * as React from 'react';
import { Alert, Icon, Spin } from 'antd';

type Props = {
  children: React.ReactNode;
};

export default class LoadingHorizontal extends React.PureComponent<Props> {
  render() {
    return (
      <Alert
        message={this.props.children}
        type="info"
        showIcon
        icon={
          <Spin
            indicator={<Icon type="loading" style={{ fontSize: 24 }} spin />}
          />
        }
      />
    );
  }
}
