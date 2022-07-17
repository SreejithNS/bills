import React, { useCallback, useEffect, useState } from 'react';
import { CircularProgress, Zoom } from '@material-ui/core';
import { useHistory, useParams } from 'react-router-dom';
import BillViewer from '../BillViewer';
import PaymentReceiveDialog from '../PaymentReceiveDialog';
import Modal, { ModalProps } from '../Modal';
import useAxios from 'axios-hooks';
import { APIResponse, axios, handleAxiosError } from '../Axios';
import { BillData } from '../../reducers/bill.reducer';
import ErrorCard from '../ImportModal/ErrorCard';
import { paths } from '../../routes/paths.enum';
import { toast } from 'react-toastify';
import { useConfirm } from 'material-ui-confirm';

export default function BillViewerModal(props: ModalProps) {
    const params = useParams<{ id: BillData["_id"] }>();
    const history = useHistory();
    const [paymentReceiveModalOpen, setPaymentReceiveModalOpen] = useState(false);
    const [{ loading, error, data }, fetchAgain] = useAxios<APIResponse<BillData>>("/bill/id/" + params.id, {
        useCache: false
    });
    const confirm = useConfirm();

    const [{ loading: paymentLoading, error: paymentError, data: paymentData }, receiveBalance] = useAxios<APIResponse<null>>({
        url: `/bill/${params.id}/payment`,
        method: "POST",
    }, { manual: true });

    useEffect(() => {
        if (paymentData) {
            toast.success("Payment Received");
            fetchAgain();
        }
        //eslint-disable-next-line
    }, [paymentData])

    useEffect(() => {
        if (paymentError) {
            handleAxiosError(paymentError);
        }
    }, [paymentError]);

    const deleteBill = useCallback(
        (billId: BillData["_id"]) => {
            confirm({
                title: "Are you sure?",
                description: "Deleting a bill is not undoable. You cannot recover the bill data once deleted.",
                confirmationText: "Delete",
                confirmationButtonProps: {
                    color: "secondary"
                }
            }).then(() => {
                return axios.delete("/bill/id/" + billId).catch(handleAxiosError);
            }).then(
                () => { toast.success("Bill deleted successfully"); history.goBack() },
                () => toast.info("Bill did not delete.")
            )
            //eslint-disable-next-line
        }, [data]
    )
    const deletePayment = useCallback(
        (billId: BillData["_id"]) => (paymentId: string) => {
            confirm({
                title: "Are you sure?",
                description: "Deleting a payment record is unrecoverable and will reduce the Paid Amount as well. Do you want to continue deleting the record?",
                confirmationText: "Delete",
                confirmationButtonProps: {
                    color: "secondary"
                }
            }).then(() => {
                return axios.delete("/bill/" + billId + "/payment/" + paymentId).catch(handleAxiosError);
            }).then(
                () => { toast.success("Payment Deleted successfully"); fetchAgain() },
                () => toast.info("Payment did not delete.")
            )
            //eslint-disable-next-line
        }, [data]
    )


    const handleCreditUpdate = () => {
        axios.put(`/bill/${params.id}/credit`).then(() => fetchAgain()).catch(handleAxiosError);
    }

    return (
        <Modal title="Bill" onClose={() => {
            if (history.length) {
                history.goBack()
            } else {
                history.push(paths.billsHome);
            }
        }}>
            {(loading || paymentLoading) && <Zoom in={loading || paymentLoading}><CircularProgress /></Zoom>}
            {error && <ErrorCard errors={error} title="Couldn't load bill" />}
            {(!loading && data && data.data !== undefined) && <BillViewer
                {...data.data as BillData<typeof data.data.gstSummary>}
                paymentDelete={deletePayment(data.data._id)}
                creditAction={handleCreditUpdate}
                receivePayment={() => setPaymentReceiveModalOpen(true)}
                onDelete={() => deleteBill(data.data?._id ?? "")}
                payBalance={(balance) => receiveBalance({ data: { paidAmount: balance } })}
            />}
            {data?.data && <PaymentReceiveDialog  {...data.data} open={paymentReceiveModalOpen} onClose={() => { fetchAgain(); setPaymentReceiveModalOpen(false) }} />}
        </Modal>
    );
}