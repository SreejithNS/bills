import React from 'react';
import { Button, CircularProgress, createStyles, Grid, makeStyles, Theme, Zoom } from '@material-ui/core';
import { Field, reduxForm } from 'redux-form';
import ReduxTextField from "../ReduxEnabledFormControls/ReduxTextField";
import { checkPhoneNumberExists } from '../../actions/app.actions';

function validate(values: { [x: string]: any; }) {
    const errors: any = {};
    const requiredFields = [
        'firstName',
        'phone',
        'password'
    ];
    requiredFields.forEach(field => {
        if (!values[field]) {
            errors[field] = 'Required';
        }
        if (values["phone"] && (values["phone"] + "").length < 10) {
            errors["phone"] = "10 Digit valid number is Required"
        }
    });
    return errors;
}

async function asyncValidate(values: { phone: string; } /*, dispatch */) {
    if ((values["phone"] + "").length < 10) return null;
    if (!(await checkPhoneNumberExists(values.phone))) {
        return Promise.reject({ phone: 'Phone Number already used' });
    }
};

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        marginButton: {
            margin: theme.spacing(2)
        }
    }),
);

const NewSalesmanForm = (props: { handleSubmit: any; pristine: any; reset: any; submitting: any; }) => {
    const { handleSubmit, pristine, reset, submitting } = props;
    const classes = useStyles();

    return (
        <form onSubmit={handleSubmit} >
            <Grid
                container
                direction="row"
                justify="flex-start"
                alignItems="center"
                spacing={2}
            >
                <Grid item xs={12} sm={6}>
                    <Field
                        name="name"
                        component={ReduxTextField}
                        label="First Name *"
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Field
                        name="phone"
                        component={ReduxTextField}
                        label="Phone Number ( UNIQUE )"
                        type="number"
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Field
                        name="password"
                        component={ReduxTextField}
                        label="Password"
                        type="password"
                    />
                </Grid>
                <Grid item xs={12} container justify="center" alignItems="center" spacing={2}>
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
    form: 'NewSalesmanForm', // a unique identifier for this form
    validate,
    asyncValidate,
})(NewSalesmanForm);
