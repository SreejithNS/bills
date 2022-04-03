import { makeStyles, Theme, Typography, TextField, Button, CircularProgress } from "@material-ui/core";
import React, { useRef } from "react";
import formDatatoJSON from "./formDatatoJSON";

const useStyles = makeStyles((theme: Theme) => ({
    loginForm: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start"
    },
    loginButton: {
        margin: theme.spacing(2)
    }
}));

interface Props {
    onSubmit: (values: Record<string, any>) => void;
    loading?: boolean;
    disabled?: boolean;
}

export default function LoginForm({ onSubmit, loading = false, disabled = false }: Props) {
    const classes = useStyles();
    const formRef = useRef<HTMLFormElement>(null);

    const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();
        onSubmit(formDatatoJSON(e.currentTarget));
    }

    return (<form
        className={classes.loginForm}
        onSubmit={handleSubmit}
        ref={formRef}
    >
        <Typography variant="h4">Login</Typography>
        <TextField
            disabled={disabled}
            name="phone"
            type="text"
            autoFocus
            margin="normal"
            label="Phone Number"
            required
            variant="outlined"
            inputProps={{
                pattern: "[1-9]{1}[0-9]{9}",
                title: "10-Digit Indian Phone number without country code"
            }}
        />
        <TextField
            disabled={disabled}
            required
            margin="normal"
            name="password"
            type="password"
            label="Password"
            variant="outlined"
        />
        <Button endIcon={loading ? <CircularProgress size="1rem" /> : undefined} disabled={disabled} className={classes.loginButton} type="submit" color="primary" variant="contained">
            {loading ? "Please wait" : "Login"}
        </Button>
    </form>)
}