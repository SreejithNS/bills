import React, { useState } from 'react';
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

export default function BillViewerModal(props: ModalProps) {
    const params = useParams<{ id: BillData["_id"] }>();
    const history = useHistory();
    const [paymentReceiveModalOpen, setPaymentReceiveModalOpen] = useState(false);
    const [{ loading, error, data }, fetchAgain] = useAxios<APIResponse<BillData>>("/bill/id/" + params.id);

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
            {(!loading && data && data.data) && <BillViewer
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
            />}
            <PaymentReceiveDialog open={paymentReceiveModalOpen} billId={params.id} onClose={() => { fetchAgain(); setPaymentReceiveModalOpen(false) }} />
        </Modal>
    );
}