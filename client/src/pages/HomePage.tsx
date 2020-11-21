import React, { Component } from 'react';
import { Container, Grid/*, Typography*/ } from '@material-ui/core';
import BillCard from '../components/BillCard';

export default class HomePage extends Component {
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
                    {[...Array(12)].map((e, k) =>
                        <Grid item key={k} >
                            {/*<Typography component="div" style={{ backgroundColor: '#cfe8fc' }} >Hello </Typography>*/}
                            <BillCard deleteAction={() => console.log(new Date())} onClickAction={console.log} />
                        </Grid>
                    )}
                </Grid>
            </Container>
        )
    }
}