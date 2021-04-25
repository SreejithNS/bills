import React, { useCallback, useState } from 'react';
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
    const [{ loading, error, data }, fetchAgain] = useAxios<APIResponse<BillData>>("/bill/id/" + params.id);
    const confirm = useConfirm();
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
            {loading && <Zoom in={loading}><CircularProgress /></Zoom>}
            {error && <ErrorCard errors={error} title="Couldn't load bill" />}
            {(!loading && data && data.data !== undefined) && <BillViewer
                receivePayment={() => setPaymentReceiveModalOpen(true)}
                createdAt={data.data.createdAt}
                customer={data.data.customer}
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
                onDelete={() => deleteBill(data.data?._id ?? "")}
                paymentDelete={deletePayment(data.data._id)}
            />}
            {data?.data && <PaymentReceiveDialog  {...data.data} open={paymentReceiveModalOpen} onClose={() => { fetchAgain(); setPaymentReceiveModalOpen(false) }} />}
        </Modal>
    );
}