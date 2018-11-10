import * as React from 'react';
import { Layout, Menu, Row, Col, Icon } from 'antd';
import { Link, withRouter, RouteComponentProps } from 'react-router-dom';
import Routes from './Routes';
import { withAuth, AuthInjectedProps } from '../js/stores/Auth';

const { Header, Content } = Layout;

type Props = AuthInjectedProps & RouteComponentProps<any>;

class MainPage extends React.PureComponent<Props> {
  handleLogout = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    this.props.logout();
  };

  render() {
    const { user, userLoading } = this.props;

    return (
      <Layout className="layout">
        <Header>
          <Row>
            <Col span={12}>
              <Link to="/">MySite</Link>
            </Col>
            <Col span={12}>
              <Menu
                theme="light"
                mode="horizontal"
                style={{ lineHeight: '64px', float: 'right' }}
              >
                {user ? (
                  <Menu.Item key="signOut">
                    {userLoading ? (
                      <em>Loading…</em>
                    ) : (
                      <a href="#signOut" onClick={this.handleLogout}>
                        Sign out
                      </a>
                    )}
                  </Menu.Item>
                ) : (
                  <Menu.Item key="signIn">
                    <Link to="/register">Sign in or register</Link>
                  </Menu.Item>
                )}
              </Menu>
            </Col>
          </Row>
        </Header>
        <Content style={{ padding: '25px 50px' }}>
          <Routes location={this.props.location} />{' '}
        </Content>
      </Layout>
    );
  }
}

// This weird typing is to avoid a strange error in server/app/index.tss
export default (withAuth(withRouter(MainPage)) as any) as React.ComponentClass<
  {},
  any
>;
