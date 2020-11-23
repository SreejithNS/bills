import React from 'react';
import { Button, CircularProgress, createStyles, Grid, makeStyles, Theme, Zoom } from '@material-ui/core';
import { Field, reduxForm } from 'redux-form';
import { itemCodeExists } from '../../actions/item.actions';
import ReduxTextField from "../ReduxEnabledFormControls/ReduxTextField";

function validate(values: { [x: string]: any; }) {
    const errors: any = {};
    const requiredFields = [
        'name',
        'code',
        'mrp',
        'rate'
    ];
    requiredFields.forEach(field => {
        if (!values[field]) {
            errors[field] = 'Required';
        }
    });
    return errors;
}

async function asyncValidate(values: { code: string; } /*, dispatch */) {
    if (await itemCodeExists(values.code)) {
        return Promise.reject({ code: 'Item Code already used' });
    }
};

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        marginButton: {
            margin: theme.spacing(2)
        }
    }),
);

const NewItemForm = (props: { handleSubmit: any; pristine: any; reset: any; submitting: any; }) => {
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
                <Grid item xs={12}>
                    <Field
                        name="name"
                        component={ReduxTextField}
                        label="Item Name"
                    />
                </Grid>
                <Grid item xs={12}>
                    <Field
                        name="code"
                        component={ReduxTextField}
                        label="Item Code ( UNIQUE )"
                    />
                </Grid>
                <Grid item xs={6}>
                    <Field name="rate" component={ReduxTextField} label="Item Rate" type="number" />
                </Grid>
                <Grid item xs={6}>
                    <Field name="mrp" component={ReduxTextField} label="Item MRP" type="number" />
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
    form: 'NewItemForm', // a unique identifier for this form
    validate,
    asyncValidate,
})(NewItemForm);
