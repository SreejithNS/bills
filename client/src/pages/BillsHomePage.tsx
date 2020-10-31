import React, { Component } from 'react';
import { Container, Grid } from '@material-ui/core';
import CustomerCard from '../components/CustomerCard';

export default class BillsHomePage extends Component {
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