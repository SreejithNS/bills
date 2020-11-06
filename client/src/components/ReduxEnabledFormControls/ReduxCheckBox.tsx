import React from 'react';
import Checkbox from '@material-ui/core/Checkbox';

const ReduxCheckbox = ({ input }: any) => (
    <Checkbox
        checked={input.value ? true : false}
        onChange={input.onChange}
    />
);

export default ReduxCheckbox;