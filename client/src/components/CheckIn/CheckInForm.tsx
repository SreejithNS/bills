import React, { FormEventHandler, PropsWithRef, ReactChild, ReactChildren, ReactElement, useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { BillItem } from "../../reducers/bill.reducer";
import { Customer } from "../../reducers/customer.reducer";
import { RootState } from "../../reducers/rootReducer";
import { CustomerSelection } from "../NewBillForm";
import { Chip, TextField, Paper, Box, Typography, Button, IconButton, InputAdornment, createStyles, makeStyles, Theme } from "@material-ui/core";
import { getDistance } from "geolib";
import moment from "moment";
import CloseIcon from '@material-ui/icons/Close';
import { config } from "process";

interface FormState {
    contact: string | null;
    products: BillItem[];
    checkInLocation: {
        type: string
        coordinates: [number, number]
    };
    note: string;
    dates: {
        name: string;
        label: string;
        value: Date;
    }[];
}

const useStyles = makeStyles((theme: Theme) => createStyles({
    form: {
        "& > *": {
            marginTop: theme.spacing(1),
        }
    }
})
);


export function CheckInForm(props: {
    onSubmit: (data: FormState) => void;
    loading: boolean;
    children?: JSX.Element;
}) {
    // Form data handlers
    const [contact, setContact] = useState<Customer | null>(null);
    const [note, setNote] = useState("");
    const [products, setProducts] = useState<BillItem[]>([]);
    const [checkInLocation, setCheckInLocation] = useState<{
        type: string
        coordinates: [number, number]
    }>({
        type: "Point",
        coordinates: [0, 0],
    });
    const [dates, setDates] = useState<{
        name: string;
        label: string;
        value: Date;
    }[]>([]);
    const [errors, setErrors] = useState<{
        field: string;
        message: string
    }[]>([]);

    // Config
    const config = useSelector((state: RootState) => state.auth.organistaionData?.checkInSettings);
    const { customerRequired, noteRequired, notePresets, dateFields } = config ?? { customerRequired: false, noteRequired: false, notePresets: [] };

    // Geo Location
    useEffect(() => {
        navigator.geolocation.watchPosition((data: GeolocationPosition) => {
            console.log("Location update")
            setCheckInLocation({
                type: "Point",
                coordinates: [data.coords.longitude, data.coords.latitude],
            });
            setErrors(prev => prev.filter(e => e.field !== "checkInLocation"));
        }, (e) => {
            if (e) {
                setErrors(prev => [...prev, { field: "checkInLocation", message: "Could not get your location" }]);
            }
        }, {
            enableHighAccuracy: true,
            timeout: 1000,
            maximumAge: 5000
        });
    }, []);

    const onSubmit: FormEventHandler<HTMLFormElement> = useCallback((e) => {
        e.preventDefault();
        props.onSubmit({
            contact: contact?._id ?? null,
            products,
            checkInLocation,
            note: note,
            dates,
        });
    }, [props, contact?._id, products, checkInLocation, note, dates]);

    const getError = useCallback((field: string) => {
        return errors.find(e => e.field === field) ?? null;
    }, [errors]);

    const coordinatesToJSON = useCallback((coordinates: [number, number] | number[]) => {
        return {
            longitude: coordinates[0],
            latitude: coordinates[1],
        };
    }, []);

    // Validation
    useEffect(() => {
        if (customerRequired && !contact) {
            setErrors(prev => [...prev, { field: "contact", message: "Customer is required" }]);
        } else {
            setErrors(prev => prev.filter(e => e.field !== "contact"));
        }
        if (noteRequired && !note) {
            setErrors(prev => [...prev, { field: "note", message: "Note is required" }]);
        } else {
            setErrors(prev => prev.filter(e => e.field !== "note"));
        }
    }, [customerRequired, noteRequired, contact, note]);

    //Styles
    const { form } = useStyles();

    if (config === null || config === undefined) {
        return null;
    } else return (
        <form className={form} onSubmit={onSubmit}>
            {customerRequired &&
                <CustomerSelection
                    customer={contact ?? undefined}
                    onChange={(c) => setContact(c)}
                    addNewCustomer={() => void (0)}
                    inputProps={{
                        error: !!(getError("contact")),
                    }}
                />
            }
            {noteRequired &&
                <>
                    <TextField
                        value={note}
                        onChange={(e) => setNote(e.target.value.trim())}
                        label="Note"
                        multiline
                        error={!!(getError("note"))}
                        fullWidth
                        rows={3}
                        required={noteRequired}
                        variant="outlined"
                    />
                    {
                        notePresets.map((preset, key) =>
                            <Chip
                                key={key}
                                label={preset}
                                size="small"
                                onClick={() => setNote(prev => (prev + " " + preset).trim())}
                            />)
                    }
                </>
            }
            {
                dateFields !== undefined && dateFields.length > 0
                    ? dateFields.map((field, key) =>
                        <TextField
                            key={key}
                            value={moment(dates.find(d => d.name === field.name)?.value ?? "").format("YYYY-MM-DD")}
                            onChange={(e) => {
                                const value = e.target.value;
                                let newDates;
                                if (!value) {
                                    newDates = dates.filter(d => d.name !== field.name);
                                } else {
                                    const lessThenToday = new Date(value).getTime() + (1000 * 5) <= new Date().getTime();
                                    if (lessThenToday) return false;
                                    if (dates.find(d => d.name === field.name)) {
                                        newDates = dates.map(d => d.name === field.name ? { ...d, value: new Date(value) } : d);
                                    } else {
                                        newDates = [...dates, { name: field.name, label: field.label, value: new Date(value) }];
                                    }
                                }
                                setDates(newDates);
                                return true;
                            }}
                            label={field.label}
                            type="date"
                            fullWidth
                            required={field.required}
                            inputProps={{
                                endAdornment:
                                    <IconButton
                                        onClick={() => {
                                            const newDates = dates.filter(d => d.name !== field.name)
                                            setDates(newDates);
                                        }}
                                    >
                                        <CloseIcon />
                                    </IconButton>
                            }}
                            variant="outlined"
                        />
                    )
                    : null
            }
            <Paper elevation={1} style={{ width: "100%" }}>
                <Box p={2}>
                    {getError("checkInLocation")?.message ?? <>
                        <Typography variant="h6">Current Location </Typography>
                        {
                            !!(contact?.location?.coordinates)
                                ? "You are " + getDistance(coordinatesToJSON(checkInLocation.coordinates), coordinatesToJSON(contact.location.coordinates)) + "m away from " + contact.name
                                : "Your current location is " + checkInLocation.coordinates[0] + "," + checkInLocation.coordinates[1]
                        }
                    </>
                    }
                </Box>
            </Paper>
            {props.children ||
                <Button type="submit" disabled={props.loading || errors.length > 0} variant="contained" color="primary">
                    Submit
                </Button>
            }
        </form >
    )
}