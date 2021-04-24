import React, { useEffect, useState } from 'react';
import useAxios from 'axios-hooks';
import { APIResponse, handleAxiosError } from '../Axios';
import { toast } from 'react-toastify';
import Modal from '../Modal';
import ErrorIcon from '@material-ui/icons/Error';
import { useParams } from 'react-router-dom';
import ParagraphIconCard from '../ParagraphIconCard';
import { Button, Checkbox, CircularProgress, FormControlLabel, TextField } from '@material-ui/core';
import { Customer } from '../../reducers/customer.reducer';
import useGeolocation from 'react-hook-geolocation'


export default function CustomerEditModal() {
    const params = useParams<{ customerId: Customer["_id"] }>();
    const [{ loading: dataLoading, error: getError, data }, getCustomerData] = useAxios<APIResponse<Customer>>("/customer/" + params.customerId, { manual: true });
    const [customerData, setCustomerData] = useState<Customer | null>(null);
    const [updateLocation, setUpdateLocation] = useState(false);

    useEffect(() => {
        getCustomerData();
    }, [params, getCustomerData]);

    useEffect(() => {
        if (data) {
            const customerData = data.data;
            if (customerData) setCustomerData(customerData);
            else setCustomerData(null);
        }
        if (getError) {
            handleAxiosError(getError);
        }
    }, [data, getError, setCustomerData]);

    const [{ loading: submitLoading, error: submitError, data: submitResponseData }, submitData] = useAxios<APIResponse<Customer>>({ url: "/customer/" + params.customerId, method: "PUT" }, { manual: true });

    const handleSubmit = (e?: any) => {
        e?.preventDefault();
        if (customerData) submitData({ url: `/customer/${params.customerId}`, method: "PUT", data: customerData });
    }

    useEffect(() => {
        if (submitResponseData) {
            toast.success("Customer Edit Saved");
        }
        if (submitError) handleAxiosError(submitError);
    }, [submitError, submitResponseData]);

    const handleGeoLocation = (locationData: any) => {
        const currentData = customerData as any;
        if (!updateLocation) {
            if (JSON.stringify(currentData?.location) !== JSON.stringify(data?.data?.location)) {
                setCustomerData((prevData) => {
                    const newData = { ...prevData as any }
                    newData.location = data?.data?.location;
                    return newData as any;
                })
            }
        }
        if (updateLocation)// || (currentData?.location && (locationData.latitude !== currentData?.location.coordinates[0] || locationData.longitude !== currentData?.location.coordinates[1])))) {
            setCustomerData((prevData) => {
                const newData = { ...prevData as any }
                newData.location = {
                    type: "Point",
                    coordinates: [locationData.latitude, locationData.longitude]
                }
                return newData as any;
            })

    }

    const location = useGeolocation({
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000
    }, handleGeoLocation);

    const pageLoading = dataLoading;
    const anyEdit = (customerData && data?.data) && JSON.stringify(customerData) !== JSON.stringify(data?.data);
    const inputLoading = pageLoading || submitLoading;

    return (pageLoading || customerData === null)
        ? (
            <Modal title="Customer Edit">
                <ParagraphIconCard
                    heading={getError && !dataLoading ? "Customer not found" : "Please wait while fetching customer data"}
                    icon={getError && !dataLoading ? <ErrorIcon /> : <CircularProgress />}
                />
            </Modal>
        )
        : (
            <Modal title="Customer Edit">
                <form style={{ display: "flex", flexFlow: "column wrap", alignItems: "center" }} onSubmit={(e) => { e.preventDefault(); if (anyEdit) handleSubmit() }}>
                    <TextField
                        disabled={inputLoading}
                        style={{ alignSelf: "stretch" }}
                        value={customerData.name}
                        onChange={(e) => {
                            const name = e.target.value;
                            setCustomerData((prevData) => {
                                const newState = { ...prevData as any }
                                newState.name = name;
                                return newState;
                            })
                        }}
                        label="Customer Name"
                        variant="outlined"
                    /><br />
                    <TextField
                        disabled={inputLoading}
                        style={{ alignSelf: "stretch" }}
                        value={customerData.phone}
                        onChange={(e) => {
                            const phone = parseInt(e.target.value);
                            setCustomerData((prevData) => {
                                const newState = { ...prevData as any }
                                newState.phone = phone;
                                return newState;
                            })
                        }}
                        label="Customer Phone Number"
                        variant="outlined"
                    /><br />
                    <TextField
                        disabled={inputLoading}
                        style={{ alignSelf: "stretch" }}
                        value={customerData.place}
                        onChange={(e) => {
                            const place = e.target.value;
                            setCustomerData((prevData) => {
                                const newState = { ...prevData as any }
                                newState.place = place;
                                return newState;
                            })
                        }}
                        label="Customer Place"
                        variant="outlined"
                    /><br />
                    <Button disabled={inputLoading || !anyEdit} onClick={handleSubmit} variant="contained" color="primary">
                        Save
                    </Button>
                    <FormControlLabel
                        control={
                            <Checkbox
                                disabled={inputLoading}
                                checked={updateLocation}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                    setUpdateLocation(event.target.checked);
                                    handleGeoLocation(location)
                                }
                                }
                                name="updateLocation"
                                color="primary"
                            />
                        }
                        label="Save current location for this customer"
                    />
                </form>
            </Modal>
        );
}
