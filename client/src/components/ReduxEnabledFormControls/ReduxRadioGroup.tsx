import React from "react";
import { RadioGroup } from "@material-ui/core";

const ReduxRadioGroup = ({ input, children }: any) => (
    <RadioGroup
        value={input.value}
        onChange={input.onChange}
    >
        {children}
    </RadioGroup>
);

export default ReduxRadioGroup;