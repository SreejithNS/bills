import React from 'react';
import { Button, CircularProgress, createStyles, Divider, Grid, makeStyles, Theme, Zoom, List, ListItem, ListSubheader, ListItemIcon } from '@material-ui/core';
import { Field, reduxForm } from 'redux-form';
import ReduxTextField from "../ReduxEnabledFormControls/ReduxTextField";
import CheckInSettings from './CheckInSettings';
import LocalOfferIcon from '@material-ui/icons/LocalOffer';
import { AccountBalanceWalletRounded, Business, BusinessCenter, PaymentRounded, Phone, RecentActors, Subtitles, Title, ViewStream } from '@material-ui/icons';

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
        },
        root: {
            backgroundColor: theme.palette.background.paper,
        }
    }),
);

const AccountEditForm = (props: { handleSubmit: any; pristine: any; reset: any; submitting: boolean; }) => {
    const { handleSubmit, pristine, reset, submitting } = props;
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
                <Grid item xs={12} sm={8} md>
                    <List subheader={
                        <ListSubheader>
                            Profile Settings
                        </ListSubheader>
                    } className={classes.root}>
                        <ListItem>
                            <ListItemIcon>
                                <RecentActors />
                            </ListItemIcon>
                            <Field
                                name="name"
                                component={ReduxTextField}
                                label="User Name"
                                fullWidth={false}
                                variant="outlined"
                                size='small'
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon>
                                <Phone />
                            </ListItemIcon>
                            <Field
                                name="phone"
                                autoComplete="false"
                                label="Phone Number"
                                component={(props: any) => <ReduxTextField autoComplete="false" {...props} />}
                                variant="outlined"
                                size='small'
                            />
                        </ListItem>
                        <ListItem>

                            <ListItemIcon>
                                <Business />
                            </ListItemIcon>
                            <Field
                                name="organisation.name"
                                component={ReduxTextField}
                                variant="outlined"
                                size='small'
                                label="Organistaion Name"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon>
                                <BusinessCenter />
                            </ListItemIcon>
                            <Field
                                name="organisation.tagline"
                                component={ReduxTextField}
                                variant="outlined"
                                size='small'
                                label="Organistaion Tagline"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon>
                                <PaymentRounded />
                            </ListItemIcon>
                            <Field
                                name="organisation.upiname"
                                component={ReduxTextField}
                                variant="outlined"
                                size='small'
                                label="UPI Name"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon>
                                <AccountBalanceWalletRounded />
                            </ListItemIcon>
                            <Field
                                name="organisation.upivpa"
                                component={ReduxTextField}
                                variant="outlined"
                                size='small'
                                label="UPI ID"
                            />
                        </ListItem>
                    </List>
                    <Divider />
                    <List subheader={
                        <ListSubheader>
                            Print Settings
                        </ListSubheader>
                    } className={classes.root}>
                        <ListItem>
                            <ListItemIcon>
                                <Title />
                            </ListItemIcon>
                            <Field
                                name="organisation.printTitle"
                                component={ReduxTextField}
                                variant="outlined"
                                size='small'
                                multiline={true}
                                label="Title"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon>
                                <ViewStream />
                            </ListItemIcon>
                            <Field
                                name="organisation.printHeader"
                                component={ReduxTextField}
                                variant="outlined"
                                size='small'
                                multiline={true}
                                label="Header"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon>
                                <LocalOfferIcon />
                            </ListItemIcon>
                            <Field
                                name="organisation.printDiscountLabel"
                                component={ReduxTextField}
                                variant="outlined"
                                size='small'
                                multiline={true}
                                label="Discount Label"
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemIcon>
                                <Subtitles />
                            </ListItemIcon>
                            <Field
                                name="organisation.printFooter"
                                component={ReduxTextField}
                                variant="outlined"
                                size='small'
                                multiline={true}
                                label="Footer"
                            />
                        </ListItem>
                    </List>
                    <Divider />
                    <CheckInSettings />
                </Grid>
                <Grid item xs={12} sm={4} md container justify="center" alignItems="center" spacing={2}>
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
        </form >
    );
};

export default reduxForm({
    form: 'AccountEditForm', // a unique identifier for this form
    validate,
    asyncValidate
})(AccountEditForm);
