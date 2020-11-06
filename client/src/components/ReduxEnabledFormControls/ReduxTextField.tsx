import React from 'react';
import TextField from '@material-ui/core/TextField';

const ReduxTextField = (
    { input, label, meta: { touched, error }, helperText, variant, type }: any
) => (
        <TextField
            variant={variant || undefined}
            onBlur={input.onBlur}
            type={type || "text"}
            error={touched && error}
            label={label}
            fullWidth
            onChange={input.onChange}
            value={input.value}
            helperText={error || helperText || ""}
        />
    );

export default ReduxTextField;