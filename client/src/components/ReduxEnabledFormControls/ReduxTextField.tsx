import React from 'react';
import TextField from '@material-ui/core/TextField';

const ReduxTextField = (
    { input, multiline, label, meta: { touched, error }, helperText, variant, type }: any
) => (
    <TextField
        variant={variant || undefined}
        onBlur={input.onBlur}
        type={type || "text"}
        error={touched && error}
        label={label}
        fullWidth
        multiline={!!(multiline ?? false)}
        onChange={input.onChange}
        value={input.value}
        helperText={error || helperText || ""}
    />
);

export default ReduxTextField;