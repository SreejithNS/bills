import React from "react";
import { CircularProgress, Grid, Typography, Zoom } from '@material-ui/core';

export default function FullScreenLoading({ error }: { error?: any }) {
    return (
        <div style={{ position: "fixed", top: 0, left: 0, height: "100vh", width: "100vw" }}>
            <Grid
                container
                spacing={0}
                direction="column"
                alignItems="center"
                justify="center"
                style={{ minHeight: '100vh', textAlign: "center" }}
            >
                <Grid item xs={6}>
                    {!error && <Zoom in={true}><CircularProgress /></Zoom>}
                    <Typography variant="subtitle1" display="block">Bills</Typography>
                    <Typography variant="caption" display="block">{error ? error.message : "...sophisticated but simple..."}</Typography>
                </Grid>
            </Grid>
        </div>
    )
}