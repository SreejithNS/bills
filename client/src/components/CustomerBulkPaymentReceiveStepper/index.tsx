import React, { useCallback, useEffect, useState } from 'react';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { Box, CircularProgress, CircularProgressProps, Paper as PaperBase, TextField, withStyles } from '@material-ui/core';
import { PaginateResult, BillData } from '../../reducers/bill.reducer';
import { APIResponse, axios, handleAxiosError } from '../Axios';
import { paths, billsPaths } from '../../routes/paths.enum';
import BillCard from '../BillCard';
import { useHistory } from 'react-router';
import { Customer } from '../../reducers/customer.reducer';
import { AxiosResponse } from 'axios';
import { toast } from 'react-toastify';
const Fade = require('react-reveal/Fade');

const Paper = withStyles((theme: Theme) => ({
    root: {
        padding: theme.spacing(2)
    }
}))(PaperBase);

function CircularProgressWithLabel(props: CircularProgressProps & { value: number }) {
    return (
        <Box position="relative" display="inline-flex">
            <CircularProgress variant="determinate" {...props} />
            <Box
                top={0}
                left={0}
                bottom={0}
                right={0}
                position="absolute"
                display="flex"
                alignItems="center"
                justifyContent="center"
            >
                <Typography variant="caption" component="div" color="textSecondary">{`${Math.round(
                    props.value,
                )}%`}</Typography>
            </Box>
        </Box>
    );
}

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        button: {
            marginRight: theme.spacing(1),
        },
        stepperContent: {
            display: "flex",
            flexFlow: "row wrap",
            alignItems: "center",
            justifyContent: "flex-start",
            "&>*": {
                marginTop: theme.spacing(2),
                marginBottom: theme.spacing(2),
                flexGrow: 1,
            },
            "&>*:first-child": {
                width: "100%",
            }
        }
    }),
);

const receiveConsolidatedPayments = async (bills: BillData[], amount: number, setProgress: (paidAmount: number, paidBills: number, remainingCash?: number) => void) => {
    var remainingCash = amount;
    var paidAmount = 0;
    var paidBills = 0;

    //Only one bill
    if (bills.length === 1) {
        const bill = bills[0];
        try {
            let payingAmount;
            if (remainingCash >= bill.billAmount - bill.paidAmount) {
                payingAmount = bill.billAmount - bill.paidAmount;
                await axios.post(`/bill/${bill._id}/payment`, {
                    paidAmount: payingAmount
                })
                remainingCash -= payingAmount;
                paidAmount += payingAmount;
                try { await axios.put(`/bill/${bill._id}/credit`) } catch (e) {
                    toast.warn(`Bill#${bill.serialNumber} payment received but did not close.`);
                    handleAxiosError(e);
                }
            } else {
                payingAmount = remainingCash;
                await axios.post(`/bill/${bill._id}/payment`, {
                    paidAmount: payingAmount
                })
                remainingCash -= payingAmount;
                paidAmount += payingAmount;
            }
            setProgress(paidAmount, ++paidBills, remainingCash);
        } catch (e) {
            toast.warn(`Payment for Bill#${bill.serialNumber} did not happen`);
            handleAxiosError(e);
        }
    } else
        //Close each bill by fullfilling the balance amount
        for (let bill of bills) {
            try {
                const payingAmount = bill.billAmount - bill.paidAmount;

                await axios.post(`/bill/${bill._id}/payment`, {
                    paidAmount: payingAmount
                })
                remainingCash -= payingAmount;
                paidAmount += payingAmount;

                try { await axios.put(`/bill/${bill._id}/credit`) } catch (e) {
                    toast.warn(`Bill#${bill.serialNumber} payment received but did not close.`);
                    handleAxiosError(e);
                }
                setProgress(paidAmount, ++paidBills, remainingCash);
            } catch (e) {
                toast.warn(`Payment for Bill#${bill.serialNumber} did not happen`);
                handleAxiosError(e);
                continue;
            }
        }
}

const billConsolidator = async (_id: string, amount: number, onFetch: (data: BillData[]) => void): Promise<BillData[]> => {
    const limit = 5;
    var page = 1;

    const getAllSubsets = <T extends unknown>(array: T[]) => {
        var x = array.reduce(
            (subsets: T[][], value: T) => subsets.concat(
                subsets.map(set => [value, ...set])
            ),
            [[]]
        );
        x.splice(0, 1);
        return x;
    }

    type ResponseData = APIResponse<PaginateResult<BillData>>;
    const fetchData = (page: number) => new Promise<AxiosResponse<ResponseData>>((res, rej) =>
        axios.get<ResponseData>(
            "/bill", {
            params: {
                page,
                limit,
                sort: "createdAt",
                customer: _id,
                credit: true
            }
        }).then(res).catch(rej)
    )

    try {
        var subsets: BillData[][] = [];
        var fetchedBills: BillData[] = [];
        var result: BillData[];

        while (true) {
            var bill: BillData | undefined;
            var setOfBills: BillData[] | undefined;

            const fetchedData = (await fetchData(page)).data?.data?.docs;
            if (fetchedData === undefined || fetchedData.length === 0) {
                //If no more bills available in next page
                if (subsets.length > 1) {
                    const bestAvailableSet = subsets.sort(
                        (seta, setb) => {
                            const sumOfA = seta.map(
                                (bill) => bill.billAmount - bill.paidAmount
                            ).reduce((acc, cur) => acc + cur);
                            const sumOfB = setb.map(
                                (bill) => bill.billAmount - bill.paidAmount
                            ).reduce((acc, cur) => acc + cur)
                            return sumOfB - sumOfA
                        }
                    )[0];
                    result = bestAvailableSet;
                    break;
                } else {//No bills availble at all
                    result = fetchedBills;
                    break;
                }
            }

            fetchedBills = [...fetchedBills, ...fetchedData];

            //Return empty array if no bills are available
            //or array of one bill if that is the only available bill
            if (fetchedBills.length === 0 || fetchedBills?.length === 1) {
                result = fetchedBills;
                break;
            }

            //Return any bill present whose total is greater
            //than or equal to the given amount
            bill = fetchedBills.find((bill) => bill.billAmount - bill.paidAmount >= amount);
            if (bill) {
                result = [bill];
                break;
            }

            subsets = getAllSubsets<BillData>(fetchedBills);

            //Filter out sets whose billTotals comes under given amount
            subsets = subsets.filter(
                (set) => set.map(
                    (bill) => bill.billAmount - bill.paidAmount
                ).reduce((acc, cur) => acc + cur) <= amount
            )

            //If subsets is empty, that means the given
            //amount is too low to fullfill atleast one bill.
            //So return the bill with lowest bill amount.
            if (subsets.length === 0) {
                const bill = fetchedBills.sort(
                    (p, q) => (p.billAmount - p.paidAmount) - (q.billAmount - q.paidAmount)
                ).shift();
                result = bill ? [bill] : []
                break;
            }

            //Check whether any set of bills whose total equals
            //to given amount, if found return that bill.
            setOfBills = subsets.find(
                (set) => set.map(
                    (bill) => bill.billAmount - bill.paidAmount
                ).reduce((acc, cur) => acc + cur) === amount
            );
            if (setOfBills && setOfBills.length) {
                result = [...setOfBills];
                break;
            }

            //Go to next page
            page++
        }
    } catch (e) {
        handleAxiosError(e);
        return [];
    }
    onFetch(result);
    return result;
}

function getSteps() {
    return ['Payment Amount', 'Bills Applicable', 'Update Payments', 'Complete'];
}

function StepContent({ step, customerId, setStep, onFinalStep }: { step: number, customerId: Customer["_id"], setStep: (step: number) => void; onFinalStep?: () => void }) {
    const [amount, setAmount] = useState(0);
    const [selectedBills, setSelectedBills] = useState<BillData[]>([]);
    const [billListLoading, setBillListLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const history = useHistory();

    useEffect(() => {
        if (amount > 0) {
            if (step === 1 && !billListLoading) {
                setBillListLoading(true)
                billConsolidator(
                    customerId, amount,
                    (data) => {
                        setSelectedBills(data); setBillListLoading(false)
                    }
                );
            }
            if (selectedBills.length > 0 && step === 2 && !billListLoading) {
                setBillListLoading(true)
                receiveConsolidatedPayments(
                    selectedBills,
                    amount,
                    (paidAmount, paidBills) => {
                        setProgress(Math.floor((selectedBills.length / paidBills) * 100))
                        if (paidBills === selectedBills.length) setBillListLoading(false);
                    }
                )
            }
            if (step === 3 && onFinalStep) onFinalStep();
        }
        //eslint-disable-next-line
    }, [amount, step]);

    const userFeedbacks = useCallback(
        () => {
            const billSum = selectedBills.map(bill => bill.billAmount - bill.paidAmount).reduce((acc, cur) => acc + cur, 0);
            let givenAmount = amount ?? 0;
            return {
                canClose: billSum <= givenAmount,
                paymentAmount: billSum <= givenAmount ? billSum : givenAmount,
                remainingCash: billSum <= givenAmount ? givenAmount - billSum : 0
            }
        },
        [selectedBills, amount]
    )

    switch (step) {
        case 0:
            return (
                <div style={{ textAlign: 'center' }}>
                    <TextField
                        type="number"
                        value={amount || ""}
                        onChange={(event) => {
                            var value: any = event.target.value;
                            value = value === "" ? 0 : Math.abs(parseFloat(value))
                            setAmount(value);
                        }}
                        variant="outlined"
                        label="Received Cash"
                    />
                </div>
            );
        case 1:
            return (
                <>
                    {billListLoading && <div style={{ textAlign: "center" }}><CircularProgress /></div>}
                    {(!billListLoading && selectedBills.length === 0) &&
                        <div style={{ textAlign: "center" }}>No payable bills found.</div>
                    }
                    {(!billListLoading && selectedBills.length > 0) && userFeedbacks().canClose
                        ?
                        <Paper variant="outlined" elevation={0}>
                            By paying&nbsp;₹{userFeedbacks().paymentAmount}&nbsp;you can close&nbsp;{selectedBills.length}&nbsp;bill(s)
                        </Paper>
                        : <Paper variant="outlined" elevation={0}>
                            You receive&nbsp;₹{userFeedbacks().paymentAmount}&nbsp;for&nbsp;{selectedBills.length}&nbsp;bill
                        </Paper>
                    }
                    {
                        selectedBills.map((bill, key) =>
                            <Fade key={key} bottom>
                                <BillCard
                                    primaryText={bill.customer.name}
                                    rightPrimary={bill.billAmount}
                                    secondaryText={bill.createdAt.toString()}
                                    deleteAction={console.log}
                                    onClickAction={() => history.push((paths.billsHome + billsPaths.billDetail).replace(":id", bill._id))}
                                />
                            </Fade>
                        )
                    }
                    {(!billListLoading && selectedBills.length > 0) &&
                        <Paper variant="outlined" elevation={0}>
                            After receiving you will have&nbsp;
                        ₹{userFeedbacks().remainingCash}&nbsp;
                        as remained cash
                        </Paper>
                    }
                </>
            )
        case 2:
            return (<>
                <div style={{ textAlign: "center" }}><CircularProgressWithLabel value={progress} /></div>
                {
                    billListLoading
                        ? <div style={{ textAlign: "center" }}>Please wait while updating, do not click Next or Back</div>
                        : <div style={{ textAlign: "center" }}>Click Next now</div>
                }
            </>);
        case 3:
            return (<>
                <div style={{ textAlign: "center" }}>All payments updated successfully</div>
                {
                    userFeedbacks().remainingCash > 0 &&
                    <Button onClick={() => {
                        setStep(0);
                        var value: any = 0;
                        value = value === "" || value === "" ? undefined : parseFloat(value)
                        setAmount(value);
                    }}>
                        Add ₹{userFeedbacks().remainingCash} to another bill
                    </Button>
                }
            </>)
        default:
            return <>Unknown step</>;
    }
}

export default function CustomerBulkPaymentReceiveStepper({ customer, onFinish }: { customer: Customer["_id"]; onFinish?: () => void }) {
    const classes = useStyles();
    const [activeStep, setActiveStep] = React.useState(0);
    const steps = getSteps();

    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleReset = () => {
        setActiveStep(0);
    };

    return (
        <Paper variant="outlined">
            <Stepper activeStep={activeStep} id="sree">
                {steps.map((label, index) => {
                    const stepProps: { completed?: boolean } = {};
                    const labelProps: { optional?: React.ReactNode } = {};
                    return (
                        <Step key={label} {...stepProps}>
                            <StepLabel {...labelProps}>{label}</StepLabel>
                        </Step>
                    );
                })}
            </Stepper>
            <div className={classes.stepperContent}>
                {activeStep === steps.length ? (
                    <>
                        <div>
                            <Typography>
                                All steps completed - you&apos;re finished
                            </Typography>
                        </div>
                        <div>
                            <Button onClick={handleReset} className={classes.button}>
                                Reset
                        </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <div>
                            <StepContent step={activeStep} customerId={customer} setStep={setActiveStep} onFinalStep={onFinish} />
                        </div>
                        <div>
                            <Button disabled={activeStep === 0} onClick={handleBack} className={classes.button}>
                                Back
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleNext}
                                className={classes.button}
                            >
                                {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </Paper>
    );
}