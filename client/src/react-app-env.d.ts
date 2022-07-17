/// <reference types="react-scripts" />
declare module 'react-hook-geolocation';

interface GeolocationCoordinates {
    readonly accuracy: number;
    readonly altitude: number | null;
    readonly altitudeAccuracy: number | null;
    readonly heading: number | null;
    readonly latitude: number;
    readonly longitude: number;
    readonly speed: number | null;
}

interface GeolocationPosition {
    readonly coords: GeolocationCoordinates;
    readonly timestamp: number;
}

declare var GeolocationCoordinates: {
    protoype: GeolocationCoordinates
}

declare var GeolocationPosition: {
    prototype: GeolocationPosition;
    new(): GeolocationPosition;
};

type ShareData = {
    title?: string;
    text?: string;
    url?: string;
    files?: File[];
};

interface Navigator {
    share?: (data?: ShareData) => Promise<void>;
}

interface Number {
    toINR: () => string;
}