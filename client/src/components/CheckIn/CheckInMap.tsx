import React, { useEffect } from "react";
import { Box, CircularProgress, Paper, PaperProps, useTheme } from "@material-ui/core";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useSelector } from "react-redux";
import { RootState } from "../../reducers/rootReducer";
import { CheckInDTO } from "../../types/CheckIn";
import { markerIcon, profileIcon } from "../Leaflet";
import { noteHighlighter } from "./CheckInTable";
import { getBounds, getCenter, getCenterOfBounds, getDistance } from "geolib";
import L from "leaflet";

function CheckInMarker({ data = [] }: { data: CheckInDTO[] }) {
    const map = useMap();

    const theme = useTheme();
    const organisationData = useSelector((state: RootState) => state.auth.organistaionData);

    useEffect(() => {
        if (data.length) {
            const adaptedInterface = data.map(d => ({
                longitude: d.checkInLocation.coordinates[0],
                latitude: d.checkInLocation.coordinates[1],
            }))

            const mapCenter = getCenterOfBounds(adaptedInterface);

            const bounds = getBounds(adaptedInterface);

            if (data.length === 1) {
                const customerData = data[0];
                if (customerData.contact && customerData.contact.location) {
                    const adaptedInterface = [...data.map(d => ({
                        longitude: d.checkInLocation.coordinates[0],
                        latitude: d.checkInLocation.coordinates[1],
                    })), {
                        longitude: customerData.contact.location.coordinates[0],
                        latitude: customerData.contact.location.coordinates[1],
                    }]
                    const mapCenter = getCenterOfBounds(adaptedInterface);
                    const bounds = getBounds(adaptedInterface);
                    const distance = getDistance(adaptedInterface[0], adaptedInterface[1]);

                    //draw dotted line between customer and checkin
                    const line = L.polyline([
                        [customerData.checkInLocation.coordinates[1], customerData.checkInLocation.coordinates[0]],
                        [customerData.contact.location.coordinates[1], customerData.contact.location.coordinates[0]],
                    ], {
                        color: theme.palette.primary.main,
                        weight: 2,
                        opacity: 0.5,
                        dashArray: '5, 5',
                    });

                    line.addTo(map);

                    // draw circle around customer
                    const circle = L.circle([customerData.contact.location.coordinates[1], customerData.contact.location.coordinates[0]], {
                        color: theme.palette.primary.main,
                        fillColor: theme.palette.primary.main,
                        fillOpacity: 0.5,
                        radius: organisationData?.checkInSettings.distanceThreshold ?? 100
                    });

                    circle.addTo(map);

                    // Show distance as text between customer and checkin
                    const distanceText = L.divIcon({
                        html: `<div style="color: ${theme.palette.text.primary}; font-size: ${theme.typography.h6.fontSize};background-color:transparent;">${distance}m</div>`,
                        className: 'leaflet-div-icon',
                    });

                    const midpoint = getCenter(adaptedInterface);
                    if (!midpoint) throw new Error("No midpoint");
                    
                    const distanceMarker = L.marker([midpoint.latitude,midpoint.longitude], {
                        icon: distanceText,
                    });

                    distanceMarker.addTo(map);

                    map.setView([mapCenter.latitude, mapCenter.longitude])
                    map.fitBounds([
                        [bounds.minLat, bounds.minLng],
                        [bounds.maxLat, bounds.maxLng],
                    ]);
                    return () => {
                        map.removeLayer(line);
                        map.removeLayer(circle);
                        map.removeLayer(distanceMarker);
                    }
                }
            } else {
                map.setView([mapCenter.latitude, mapCenter.longitude])
                map.fitBounds([
                    [bounds.minLat, bounds.minLng],
                    [bounds.maxLat, bounds.maxLng],
                ]);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, map, theme.palette.primary.main]);

    console.log(data)
    if (organisationData === null) {
        return (<Box flexGrow={1} padding={theme.spacing(2)} margin={theme.spacing(1)}>
            <CircularProgress />
        </Box>)

    } else return <>
        {!!data.length && data.map(({ note, checkInLocation: { coordinates }, ...rest }, key) =>
            <Marker icon={markerIcon} key={key} position={[coordinates[1], coordinates[0]]}>
                <Popup zoomAnimation={true} keepInView={data.length === 1}>
                    {<strong>{rest.contact?.name}</strong> ?? null} <br />
                    {noteHighlighter(note, organisationData.checkInSettings.notePresets)}
                </Popup>
            </Marker>
        )
        }
        {
            data.length === 1 && data[0].contact?.location?.coordinates &&
            <Marker icon={profileIcon} position={[data[0].contact.location.coordinates[1], data[0].contact.location.coordinates[0]]}>
                <Popup zoomAnimation={true}>
                    {<strong>{data[0].contact.name} Original Location</strong> ?? null}
                </Popup>
            </Marker>
        }
    </>
}


export default function CheckInMap({ data, ...rest }: { data: CheckInDTO[] } & PaperProps) {
    return (
        <Paper elevation={3} style={{
            height: "100%",
            overflow: "hidden",
        }} {...rest}>
            <MapContainer center={[20.593684, 78.96288]} zoom={18} style={{
                height: "100%",
                width: "100%",
                minHeight: "400px",
                zIndex: 0,
            }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <CheckInMarker key={Math.random()} data={data ?? []} />
            </MapContainer>
        </Paper>
    )

}