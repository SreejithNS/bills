import React, { useEffect } from 'react';
import NewSalesmanForm from '../NewSalesmanForm';
import useAxios from 'axios-hooks';
import { APIResponse, handleAxiosError } from '../Axios';
import { UserData } from '../../reducers/auth.reducer';
import { toast } from 'react-toastify';
import Modal from '../Modal';
import { useUsersUnderAdmin } from '../../actions/auth.actions';


export default function NewSalesmanModal() {
    const [{ loading, error, data }, postData] = useAxios<APIResponse<UserData["_id"]>>({ url: "/auth/register", method: "POST" }, { manual: true });
    const { fetchUsersUnderAdmin } = useUsersUnderAdmin();
    const handleSubmit = (values: any) => {
        postData({ url: "/auth/register", method: "POST", data: values });
    }

    useEffect(() => {
        if (data) {
            toast.success("Salesman added under you");
            fetchUsersUnderAdmin();
        }
        if (error) handleAxiosError(error);
    }, [data, error])

    return (
        <Modal title="Add Salesman">
            <NewSalesmanForm submitting={loading} onSubmit={handleSubmit} />
        </Modal>
    );
}
