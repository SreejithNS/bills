import React from 'react';
import { Button, CircularProgress, createStyles, Grid, makeStyles, Theme, Zoom } from '@material-ui/core';
import { Field, reduxForm } from 'redux-form';
import ReduxTextField from "../ReduxEnabledFormControls/ReduxTextField";

function validate(values: { [x: string]: any; }) {
    const errors: any = {};
    const requiredFields = [
        'password'
    ];
    requiredFields.forEach(field => {
        if (!values[field]) {
            errors[field] = 'Required';
        }
        if (values["password"] && values.password.length < 4) {
            errors.password = "Minimum of 4 characters required";
        }
    });
    return errors;
}

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        marginButton: {
            margin: theme.spacing(2)
        }
    }),
);

const UpdateSalesmanPasswordForm = (props: { handleSubmit: any; pristine: any; reset: any; submitting: any; }) => {
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
                <Grid item xs={6}>
                    <Field
                        name="password"
                        component={ReduxTextField}
                        label="Password"
                        type="password"
                        disabled={submitting}
                    />
                </Grid>
                <Grid item xs={6} container justify="center" alignItems="center" spacing={2}>
                    {!(pristine || submitting)
                        ? <React.Fragment>
                            <Button className={classes.marginButton} variant="contained" disabled={pristine || submitting} color="primary" disableElevation type="submit">
                                Update
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

export default reduxForm<{ password: string }>({
    form: 'UpdateSalesmanPasswordForm', // a unique identifier for this form
    validate,
    // asyncValidate,
})(UpdateSalesmanPasswordForm);
