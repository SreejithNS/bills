import React from 'react';
import { Button, CircularProgress, createStyles, Divider, Grid, makeStyles, Theme, Typography, Zoom } from '@material-ui/core';
import { Field, reduxForm } from 'redux-form';
import ReduxTextField from "../ReduxEnabledFormControls/ReduxTextField";
import { useSelector } from 'react-redux';
import { RootState } from '../../reducers/rootReducer';

function validate(values: { [x: string]: any; }) {
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

async function asyncValidate(values: { code?: string; }, _: any, props: any) {
    return Promise.resolve()
};

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        marginButton: {
            margin: theme.spacing(2)
        }
    }),
);

const AccountEditForm = (props: { handleSubmit: any; pristine: any; reset: any; submitting: boolean; }) => {
    const { handleSubmit, pristine, reset, submitting } = props;
    const { userData } = useSelector((state: RootState) => state.auth);
    const classes = useStyles();

    return (
        <form onSubmit={handleSubmit} >
            <Grid
                container
                direction="row"
                justify="flex-start"
                alignItems="center"
                spacing={4}
            >
                <Grid item xs={12}>
                    <Field
                        name="name"
                        component={ReduxTextField}
                        label="User Name"
                    />
                </Grid>
                {(userData?.type === 0 || userData?.type === 1) ? <>
                    <Grid item xs={12}>
                        <Field
                            name="organisation.name"
                            component={ReduxTextField}
                            label="Organisation Name"

                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Field
                            name="organisation.tagline"
                            component={ReduxTextField}
                            label="Organistaion Tagline"
                        /></Grid>
                    <Grid item xs={12}>
                        <Divider /><br />
                        <Typography variant="subtitle1">Print Settings</Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Field
                            name="organisation.printTitle"
                            component={ReduxTextField}
                            label="Print Title"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Field
                            name="organisation.printHeader"
                            component={ReduxTextField}
                            label="Print Header"
                            multiline={true}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Field
                            name="organisation.printFooter"
                            component={ReduxTextField}
                            label="Print Footer"
                            multiline={true}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Field
                            name="organisation.printTitle"
                            component={ReduxTextField}
                            label="Print Title"
                        />
                    </Grid>
                </> : <></>}
                <Grid item xs={12}>
                    <Field
                        name="phone"
                        autoComplete="false"
                        component={(props: any) => <ReduxTextField autoComplete="false" {...props} />}
                        label="Phone Number"
                    />
                </Grid>
                <Grid item xs={12} container justify="center" alignItems="center" spacing={2}>
                    {!(pristine || submitting)
                        ? <React.Fragment>
                            <Button className={classes.marginButton} variant="contained" disabled={pristine || submitting} color="primary" disableElevation type="submit">
                                Save
                            </Button>
                            <Button className={classes.marginButton} variant="outlined" disabled={pristine || submitting} color="primary" disableElevation onClick={reset}>
                                Undo Changes
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
    form: 'AccountEditForm', // a unique identifier for this form
    validate,
    asyncValidate
})(AccountEditForm);
