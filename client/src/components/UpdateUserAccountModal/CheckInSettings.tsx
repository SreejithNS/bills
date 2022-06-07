import React, { useCallback, useState } from 'react';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';
import Switch from '@material-ui/core/Switch';
import { Field } from 'redux-form';
import { AddCircle, CancelRounded, CheckCircleOutlineRounded, EventNoteRounded, Note, RecentActors, ShoppingCart, SubjectOutlined } from '@material-ui/icons';
import { Chip, IconButton, Input, InputAdornment, InputBaseProps, TextField, useTheme, Tooltip, Box } from '@material-ui/core';
import camelcase from 'camelcase';
import StarRateIcon from '@material-ui/icons/StarRate';

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            backgroundColor: theme.palette.background.paper,
        },
    }),
);

const DateFieldsInput = (props: InputBaseProps) => {
    type FieldFormat = {
        name: string;
        label: string;
        required: boolean;
    }
    const fields: FieldFormat[] = Array.isArray(props.value) ? props.value as FieldFormat[] : [];
    const [newField, setNewField] = useState<FieldFormat | null>(null);
    const theme = useTheme();
    return (
        <>
            {fields.map((field, index) => (
                <Chip
                    key={index}
                    label={field.label}
                    color="primary"
                    icon={<Tooltip title={`${field.label} is ${field.required ? "mandatory" : "not mandatory"}`}>
                        <StarRateIcon
                            color={field.required ? 'secondary' : 'primary'}
                        />
                    </Tooltip>
                    }
                    onDelete={() => {
                        const newFields = [...fields.filter((f, i) => i !== index)];
                        props.onChange && props.onChange(newFields as any);
                    }}
                    style={{ margin: theme.spacing(1), marginLeft: 0 }}
                />
            ))}
            {
                newField !== null && <Box display="flex">
                    <Input
                        type="text"
                        placeholder='New Date Field Name'
                        value={newField.label}
                        onChange={(e) => {
                            const label = e.target.value;
                            const name = camelcase(label);
                            setNewField((prev: FieldFormat | null) => ({ required: prev?.required ?? false, name, label }))
                        }}
                        endAdornment={
                            <InputAdornment position="end">
                                <Tooltip title={`${newField.label || "This field"} will ${!newField.required ? "not" : ""}  be marked as mandatory`}>
                                    <IconButton
                                        onClick={() => {
                                            setNewField(prev => {
                                                if (prev) {
                                                    return { ...prev, required: !prev.required }
                                                } else return prev;
                                            })
                                        }}
                                    >
                                        <StarRateIcon color={newField.required ? 'secondary' : 'primary'} />
                                    </IconButton>
                                </Tooltip>
                            </InputAdornment>
                        }
                    />
                    <IconButton
                        onClick={() => {
                            props.onChange && props.onChange([...fields, newField] as any);
                            setNewField(null);
                        }}
                    >
                        <CheckCircleOutlineRounded />
                    </IconButton>
                    <IconButton
                        onClick={() => {
                            setNewField(null);
                        }}
                    >
                        <CancelRounded />
                    </IconButton>
                </Box>
            }
            {
                newField === null &&
                <IconButton onClick={() => setNewField({ name: '', label: '', required: false })}>
                    <AddCircle />
                </IconButton>
            }
        </>
    );
}

const CommaSeperatedTextInput = ({ seperator = ",", ...props }: InputBaseProps & { seperator?: string }) => {
    const theme = useTheme();
    const [values, setValues] = useState<string[]>(Array.isArray(props.value) ? props.value : (props.value as string).split(seperator));
    const [newValue, setNewValue] = useState<string>("");

    const updateValue = useCallback((values: string[]) => {
        if (props.onChange) {
            props.onChange(values as any);
        }
    }, [props]);

    const removeValue = useCallback((index: number) => {
        const newValues = values.filter((_, i) => i !== index);
        setValues(newValues);
        updateValue(newValues);
    }, [updateValue, values]);

    const addValue = useCallback((value: string) => {
        const newValues = [...values, value];
        setValues(newValues);
        updateValue(newValues);
    }, [updateValue, values]);

    const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        if (newValue.endsWith(seperator)) {
            addValue(newValue.slice(0, -seperator.length));
            setNewValue("");
        } else {
            setNewValue(newValue)
        }
    }, [seperator, addValue]);

    const handleBlur = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
        const value = event.target.value;
        if (value.endsWith(seperator)) {
            addValue(value.slice(0, -seperator.length));
            setNewValue("");
        }
    }, [seperator, addValue]);

    return (<>
        Note Presets are separated by semicolons ';'
        <Input
            {...props}
            fullWidth
            type='text'
            value={newValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={(event) => {
                if (event.key === "Enter") {
                    addValue(newValue);
                    setNewValue("");
                }
            }}
        />
        {values.map((value: string, index: number) =>
            <Chip
                key={index}
                label={value}
                onDelete={() => removeValue(index)}
                style={{ margin: theme.spacing(1), marginLeft: 0 }}
            />
        )
        }
    </>

    );
}

export default function CheckInSettings() {
    const classes = useStyles();

    return (
        <List subheader={
            <ListSubheader>
                CheckIn Settings
            </ListSubheader>
        } className={classes.root}>
            <ListItem>
                <ListItemIcon>
                    <RecentActors />
                </ListItemIcon>
                <ListItemText primary="Contact Required" secondary="This will enable Contact field in CheckIn entry form" />
                <ListItemSecondaryAction>
                    <Field
                        name="organisation.checkInSettings.customerRequired"
                        type="checkbox"
                        component={(props: any) => <Switch edge="end" {...props.input} />}
                    />
                </ListItemSecondaryAction>
            </ListItem>
            <ListItem>
                <ListItemIcon>
                    <Note />
                </ListItemIcon>
                <ListItemText primary="Threshold Distance" secondary={
                    <Field
                        name="organisation.checkInSettings.distanceThreshold"
                        type="number"
                        component={(props: any) =>
                            <TextField {...props.input} type="number" InputProps={{
                                endAdornment: <InputAdornment position="end">meters</InputAdornment>,
                            }} />
                        }
                    />
                } />
            </ListItem>
            <ListItem>
                <ListItemIcon>
                    <ShoppingCart />
                </ListItemIcon>
                <ListItemText primary="Enable Products" secondary="This will enable Products to be added to CheckIn entry" />
                <ListItemSecondaryAction>
                    <Field
                        name="organisation.checkInSettings.productsRequired"
                        type="checkbox"
                        component={(props: any) => <Switch edge="end" {...props.input} />}
                    />
                </ListItemSecondaryAction>
            </ListItem>
            <ListItem>
                <ListItemIcon>
                    <Note />
                </ListItemIcon>
                <ListItemText primary="Enable Notes" secondary="This will enable users to attach note to a CheckIn entry" />
                <ListItemSecondaryAction>
                    <Field
                        name="organisation.checkInSettings.noteRequired"
                        type="checkbox"
                        component={(props: any) => <Switch edge="end" {...props.input} />}
                    />
                </ListItemSecondaryAction>
            </ListItem>
            <ListItem>
                <ListItemIcon>
                    <SubjectOutlined />
                </ListItemIcon>
                <ListItemText primary="Note Presets" secondary={
                    <Field
                        name="organisation.checkInSettings.notePresets"
                        component={(props: any) =>
                            <CommaSeperatedTextInput seperator=';' {...props.input} />
                        }
                    />
                } />
            </ListItem>
            <ListItem>
                <ListItemIcon>
                    <EventNoteRounded />
                </ListItemIcon>
                <ListItemText primary="Date Fields" secondary={
                    <Field
                        name="organisation.checkInSettings.dateFields"
                        component={(props: any) =>
                            <DateFieldsInput {...props.input} />
                        }
                    />
                } />
            </ListItem>
            {/* <ListItem>
                <ListItemIcon>
                    <BluetoothIcon />
                </ListItemIcon>
                <ListItemText id="switch-list-label-bluetooth" primary="Bluetooth" />
                <ListItemSecondaryAction>
                    <Switch
                        edge="end"
                        onChange={handleToggle('bluetooth')}
                        checked={checked.indexOf('bluetooth') !== -1}
                        inputProps={{ 'aria-labelledby': 'switch-list-label-bluetooth' }}
                    />
                </ListItemSecondaryAction>
            </ListItem> */}
        </List>
    );
}
