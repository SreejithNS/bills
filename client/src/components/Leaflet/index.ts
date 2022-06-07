import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import "./icon.css"

const markerIcon = new L.Icon({
    iconUrl: icon,
    iconAnchor: [12, 41],
});

const profileIcon = L.divIcon({
    className: 'profile-icon icon',
    html: '<div class="profile-solid icon"></div>',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
});

export { markerIcon,profileIcon };