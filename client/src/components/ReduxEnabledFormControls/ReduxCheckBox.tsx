import React from 'react';
import Checkbox from '@material-ui/core/Checkbox';
import { FormControlLabel } from '@material-ui/core';

const ReduxCheckbox = ({ input, label }: any) => {
    return (
        <FormControlLabel
            control={
                <Checkbox
                    checked={input.value ? true : false}
                    onChange={input.onChange}
                />
            }
            label={label || ''}
        />

    )
};

export default ReduxCheckbox;