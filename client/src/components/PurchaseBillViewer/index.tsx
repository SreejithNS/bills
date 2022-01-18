import React, { useCallback, useEffect, useState } from 'react';
import { CircularProgress, Zoom } from '@material-ui/core';
import { useHistory, useParams } from 'react-router-dom';
import PurchaseBillViewer from './PurchaseBillViewerCard';
import PaymentReceiveDialog from '../PaymentReceiveDialog';
import Modal, { ModalProps } from '../Modal';
import useAxios from 'axios-hooks';
import { APIResponse, axios, handleAxiosError } from '../Axios';
import { PurchaseBillData } from '../../reducers/purchasebill.reducer';
import ErrorCard from '../ImportModal/ErrorCard';
import { paths } from '../../routes/paths.enum';
import { toast } from 'react-toastify';
import { useConfirm } from 'material-ui-confirm';

export default function BillViewerModal(props: ModalProps) {
    const params = useParams<{ purchaseBillId: PurchaseBillData["_id"] }>();
    const history = useHistory();
    const [paymentReceiveModalOpen, setPaymentReceiveModalOpen] = useState(false);
    const [{ loading, error, data }, fetchAgain] = useAxios<APIResponse<PurchaseBillData>>("/purchasebill/id/" + params.purchaseBillId, {
        useCache: false
    });
    const confirm = useConfirm();

    const [{ loading: paymentLoading, error: paymentError, data: paymentData }, receiveBalance] = useAxios<APIResponse<null>>({
        url: `/purchasebill/${params.purchaseBillId}/payment`,
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

    // const deleteBill = useCallback(
    //     (billId: PurchaseBillData["_id"]) => {
    //         confirm({
    //             title: "Are you sure?",
    //             description: "Deleting a bill is not undoable. You cannot recover the bill data once deleted.",
    //             confirmationText: "Delete",
    //             confirmationButtonProps: {
    //                 color: "secondary"
    //             }
    //         }).then(() => {
    //             return axios.delete("/bill/id/" + billId).catch(handleAxiosError);
    //         }).then(
    //             () => { toast.success("Bill deleted successfully"); history.goBack() },
    //             () => toast.info("Bill did not delete.")
    //         )
    //         //eslint-disable-next-line
    //     }, [data]
    // )
    const deletePayment = useCallback(
        (billId: PurchaseBillData["_id"]) => (paymentId: string) => {
            confirm({
                title: "Are you sure?",
                description: "Deleting a payment record is unrecoverable and will reduce the Paid Amount as well. Do you want to continue deleting the record?",
                confirmationText: "Delete",
                confirmationButtonProps: {
                    color: "secondary"
                }
            }).then(() => {
                return axios.delete("/purchasebill/" + billId + "/payment/" + paymentId).catch(handleAxiosError);
            }).then(
                () => { toast.success("Payment Deleted successfully"); fetchAgain() },
                () => toast.info("Payment did not delete.")
            )
            //eslint-disable-next-line
        }, [data]
    )


    const handleCreditUpdate = () => {
        axios.put(`/purchasebill/${params.purchaseBillId}/credit`).then(() => fetchAgain()).catch(handleAxiosError);
    }

    return (
        <Modal title="Purchase Bill" onClose={() => {
            if (history.length) {
                history.goBack()
            } else {
                history.push(paths.billsHome);
            }
        }}>
            {(loading || paymentLoading) && <Zoom in={loading || paymentLoading}><CircularProgress /></Zoom>}
            {error && <ErrorCard errors={error} title="Couldn't load bill" />}
            {(!loading && data && data.data !== undefined) && <PurchaseBillViewer
                receivePayment={() => setPaymentReceiveModalOpen(true)}
                createdAt={data.data.createdAt}
                contact={data.data.contact}
                items={data.data.items}
                soldBy={data.data.soldBy}
                billAmount={data.data.billAmount}
                discountAmount={data.data.discountAmount}
                payments={data.data.payments || []}
                credit={data.data.credit}
                paidAmount={data.data.paidAmount}
                creditAction={handleCreditUpdate}
                serialNumber={data.data.serialNumber}
                _id={data.data._id}
                belongsTo={data.data.belongsTo}
                itemsTotalAmount={data.data.itemsTotalAmount}
                location={data.data.location}
                paymentDelete={deletePayment(data.data._id)}
                payBalance={(balance) => receiveBalance({ data: { paidAmount: balance } })}
                category={data.data.category}
                sales={data.data.sales} />}
            {data?.data && <PaymentReceiveDialog  {...data.data} customer={data.data.contact} open={paymentReceiveModalOpen} onClose={() => { fetchAgain(); setPaymentReceiveModalOpen(false) }} />}
        </Modal>
    );
}