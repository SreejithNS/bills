import React from 'react';
import { Button, CircularProgress, createStyles, Grid, IconButton, makeStyles, Theme, Zoom } from '@material-ui/core';
import { Field, FieldArray, reduxForm } from 'redux-form';
import { itemCodeExists } from '../../actions/item.actions';
import ReduxTextField from "../ReduxEnabledFormControls/ReduxTextField";
import RemoveCircleOutlineRoundedIcon from '@material-ui/icons/RemoveCircleOutlineRounded';

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

    if (values["units"] && values["units"].length) {
        const unitsErrors: any[] = [];
        values["units"].forEach((unit: any, index: number) => {
            const unitError = {};
            if (!unit.name) Object.assign(unitError, { name: "Required" });
            if (!unit.rate || parseFloat(unit.rate) <= 0) Object.assign(unitError, { rate: "Must be greater than 0" });
            if (!unit.mrp || parseFloat(unit.mrp) <= 0) Object.assign(unitError, { mrp: "Must be greater than 0" });

            if (Object.entries(unitError).length) unitsErrors[index] = unitError;
        })
        if (unitsErrors.length) errors.units = unitsErrors;
    }

    return errors;
}

async function asyncValidate(values: { code: string; }, _:any, props:any) {
    if (await itemCodeExists(props.category, values.code)) {
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

const renderUnits = ({ fields }: { fields: any }) => (
    <>
        <Grid item xs={12}>
            <Button variant="outlined" onClick={() => fields.push({})} color="primary" fullWidth>
                Add Unit
            </Button>
        </Grid>
        {fields.map((unit: any, index: number) => (
            <React.Fragment key={index}>
                <Grid item xs={12}>
                    <Field
                        name={`${unit}.name`}
                        component={ReduxTextField}
                        label="Unit Name"
                    />
                </Grid>
                <Grid item xs={5}>
                    <Field name={`${unit}.rate`} component={ReduxTextField} label="Unit Rate" type="number" />
                </Grid>
                <Grid item xs={5}>
                    <Field name={`${unit}.mrp`} component={ReduxTextField} label="Unit MRP" type="number" />
                </Grid>
                <Grid item xs={2}>
                    <IconButton
                        onClick={() => fields.remove(index)}>
                        <RemoveCircleOutlineRoundedIcon />
                    </IconButton>
                </Grid>
            </React.Fragment>
        ))}
    </>
)

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
                <Grid item xs={12}
                    container
                    direction="row"
                    justify="flex-start"
                    alignItems="center"
                    spacing={2}>
                    <FieldArray name="units" component={renderUnits} />
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
