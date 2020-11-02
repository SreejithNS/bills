import React, { Component } from 'react';
import { Container, Grid } from '@material-ui/core';
import { connect } from 'react-redux';
import CustomerCard from '../components/CustomerCard';

class BillsHomePage extends Component {
    render() {
        return (
            <Container fixed>
                <Grid
                    container
                    direction="column"
                    justify="flex-start"
                    alignItems="center"
                    spacing={1}
                >
                    {[...Array(12)].map((e,k) =>
                        <Grid item key={k} >
                            {/* <Typography component="div" style={{ backgroundColor: '#cfe8fc' }} >Hello </Typography> */}
                            <CustomerCard />
                        </Grid>
                    )}
                </Grid>
            </Container>
        )
    }
}

const mapStateToProps = (state:any) => { 
    return {
        ...state.customer
    }
};

const mapDispatchToProps = () => { };

export default connect(mapStateToProps, mapDispatchToProps)(BillsHomePage);