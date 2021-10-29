import React from "react";
import { CircularProgress, Grid, Typography, Zoom } from '@material-ui/core';
import logo from "../../assets/logo_blue.svg";

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
                    <img src={logo} style={{ width: "25vw" }} alt="Billz Logo" />
                    <Typography variant="subtitle1" display="block"><b>Billz</b></Typography>
                    <Typography variant="caption" display="block" style={{ marginBottom: "16px" }}>{error ? error.message : "Lead your business with Bills"}</Typography>
                    {!error && <Zoom in={true}><CircularProgress /></Zoom>}
                </Grid>
            </Grid>
        </div>
    )
}