import React, { Component } from 'react';
import { Grid, Typography } from '@material-ui/core';
import HomeCard from '../components/HomeCard';
import { compose } from 'redux';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { paths, billsPaths, itemPaths, customersPaths } from '../routes/paths.enum';
import { connect } from 'react-redux';
import { RootState } from '../reducers/rootReducer';
import PageContainer from '../components/PageContainer';
import { version as appVersion } from '../../package.json';

const mapStateToProps = (state: RootState) => ({
    forbiddenRoutes: state.app.settings.restrictedRoutes
})

type Props = RouteComponentProps & ReturnType<typeof mapStateToProps>;

class HomePage extends Component<Props> {

    openLink = (link: string) => () => {
        const { history } = this.props;
        history.push(link);
    }

    checkAccessibility = (link: string) => this.props.forbiddenRoutes.indexOf(link as never) < 0;

    render() {
        const { checkAccessibility, openLink } = this;
        return (
            <PageContainer>
                <Grid
                    container
                    direction="row"
                    justify="center"
                    alignItems="stretch"
                    spacing={2}
                >
                    <Grid item xs={12}>
                        <Typography variant="h4">
                            Good Day!
                            </Typography>
                    </Grid>
                    {checkAccessibility(paths.billsHome)
                        && <Grid item xs={12} sm={6} md={4}>
                            <HomeCard
                                onClick={openLink(paths.billsHome + billsPaths.addBill)}
                                title="New Bill"
                                content="Add new bill from a customer."
                            />
                        </Grid>
                    }

                    {checkAccessibility(paths.items)
                        && <Grid item xs={12} sm={6} md={4}>
                            <HomeCard
                                onClick={openLink(paths.items + itemPaths.addItem)}
                                title="New Item"
                                content="Add new item to the inventory."
                            />
                        </Grid>
                    }

                    {checkAccessibility(paths.customer)
                        && <Grid item xs={12} sm={6} md={4}>
                            <HomeCard
                                onClick={openLink(paths.customer + customersPaths.createCustomer)}
                                title="New Customer"
                                content="Add new customer with details like phone number and place."
                            />
                        </Grid>
                    }

                    {checkAccessibility(paths.billsHome)
                        && <Grid item xs={12} sm={6} md={4}>
                            <HomeCard
                                onClick={openLink(paths.billsHome)}
                                title="Receive Payment"
                                content="Receive Payments for Credit Bills by searching them with customer name or serial number."
                            />
                        </Grid>
                    }
                    <Grid item xs={12} sm={6} md={4}>
                        <HomeCard
                            onClick={() => console.log("Everything works fine.")}
                            content={"Bills WebApp: v" + appVersion}
                        />
                    </Grid>

                </Grid>
            </PageContainer>
        )
    }
}

export default compose(withRouter, connect(mapStateToProps))(HomePage) as React.ComponentType;