import React from 'react';
import { TextField } from "@material-ui/core";

const ReduxSelectField = (
    { input, label, meta: { touched, error }, children, helperText }: any
) => (
        <TextField
            select
            label={label}
            value={input.value}
            onChange={input.onChange}
            helperText={helperText || ""}
        >
            {children}
        </TextField>
    );

export default ReduxSelectField;