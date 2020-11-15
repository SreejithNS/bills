import { Button, CircularProgress, createStyles, Grid, makeStyles, Theme, Zoom } from '@material-ui/core';
import React from 'react';
import { Field, reduxForm } from 'redux-form';
// import { addCustomer } from '../../actions/customer.action';
import ReduxTextField from "../ReduxEnabledFormControls/ReduxTextField";

function validate(values: { [x: string]: any; email: string; }) {
    const errors: any = {};
    const requiredFields = [
        'name',
        'phone'
    ];
    requiredFields.forEach(field => {
        if (!values[field]) {
            errors[field] = 'Required';
        }
    });
    return errors;
}


const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function asyncValidate(values: { email: string; } /*, dispatch */) {
    await sleep(1000); // simulate server latency
    if (['foo@foo.com', 'bar@bar.com'].includes(values.email)) {
        Promise.reject({ email: 'Email already Exists' });
    }
};

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        marginButton: {
            margin: theme.spacing(2)
        }
    }),
);


const NewCustomerForm = (props: { handleSubmit: any; pristine: any; reset: any; submitting: any; }) => {
    const { handleSubmit, pristine, reset, submitting } = props;
    const classes = useStyles();

    return (
        <form onSubmit={handleSubmit} >
            <Grid
                container
                direction="column"
                justify="flex-start"
                alignItems="stretch"
                spacing={2}
            >
                <Grid item xs>

                    <Field
                        name="name"
                        component={ReduxTextField}
                        label="Name"
                    />
                </Grid>
                <Grid item xs>
                    <Field name="phone" component={ReduxTextField} label="Phone" type="number" /></Grid>
                <Grid item xs>
                    <Field name="place" component={ReduxTextField} label="Place" /></Grid>
                <Grid item xs container justify="center" alignItems="center" spacing={2}>
                    {!(pristine || submitting)
                        ? <React.Fragment>
                            <Button className={classes.marginButton} variant="contained" disabled={pristine || submitting} color="primary" disableElevation type="submit">
                                Create
                            </Button>
                            <Button className={classes.marginButton} variant="outlined" disabled={pristine || submitting} color="primary" disableElevation onClick={reset}>
                                Clear
                            </Button>
                        </React.Fragment>
                        :
                        <Zoom in={submitting}><CircularProgress /></Zoom>}
                </Grid>

            </Grid>
        </form>
    );
};

export default reduxForm({
    form: 'NewCustomerForm', // a unique identifier for this form
    validate,
    asyncValidate,
})(NewCustomerForm);
