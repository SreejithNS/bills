import { Box, Button, FormControl, Grid, InputLabel, MenuItem, Select, TextField, TextFieldProps, useTheme } from "@material-ui/core";
import React, { useCallback, useRef, useState } from "react";
import { BillItem } from "../../reducers/bill.reducer";
import { Product } from "../../reducers/product.reducer";
import { BillItemSelection } from "../NewBillForm";

const Pulse = require('react-reveal/Pulse');

type ValueType<ArrayType extends readonly unknown[]> =
    ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

export function ProductsSelect({ onSelect, onClear }: {
    onSelect: (product: BillItem) => void;
    onClear: () => void;
}) {
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedProductQuantity, setSelectedProductQuantity] = useState<number>(0);
    const [selectedProductUnit, setSelectedProductUnit] = useState<ValueType<Product["units"]> | null>(null);
    const [selectedProductPrice, setSelectedProductPrice] = useState<number>(0);
    const theme = useTheme();

    // Refs for focus
    const quantityRef = useRef<HTMLInputElement>(null);
    const productSelectionRef = useRef<HTMLInputElement>(null);

    const handleProductSelect = useCallback((product: Product | null) => {
        setSelectedProduct(product);

        if (product && quantityRef.current) {
            quantityRef.current.focus();
        }

        setSelectedProductQuantity(0);
        setSelectedProductUnit(null);
        setSelectedProductPrice(product?.rate ?? 0);
    }, []);

    const handleProductUnitChange = useCallback((unit: ValueType<Product["units"]> | null) => {
        setSelectedProductUnit(unit);
        if (unit) {
            setSelectedProductPrice(unit.rate);
        } else {
            setSelectedProductPrice(selectedProduct?.rate || 0);
        }
    }, [selectedProduct?.rate]);

    const handleSubmit = useCallback(() => {
        if (selectedProduct) {
            const newProduct: BillItem = {
                ...selectedProduct,
                quantity: selectedProductQuantity || 1,
                amount: selectedProductPrice * selectedProductQuantity,
            };

            if (selectedProductUnit) {
                newProduct.unit = selectedProductUnit;
                newProduct.rate = selectedProductUnit.rate;
                newProduct.quantity = selectedProductQuantity || 1;
                newProduct.amount = selectedProductPrice * selectedProductQuantity;
            }
            onSelect(newProduct);
            setSelectedProduct(null);
            setSelectedProductQuantity(0);
            setSelectedProductUnit(null);
            setSelectedProductPrice(0);
            return true;
        }
        return false;
    }, [onSelect, selectedProduct, selectedProductPrice, selectedProductQuantity, selectedProductUnit]);

    // KeyPress handler for handling enter key press to select product
    const handleKeyPress = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            event.preventDefault();
            event.stopPropagation();
            handleSubmit();
            productSelectionRef.current?.focus();
        }
    }, [handleSubmit]);

    const variant: TextFieldProps["variant"] = "outlined";
    const size: TextFieldProps["size"] = "small";

    return (
        <Box component="fieldset" margin={0} padding={2} borderRadius={theme.shape.borderRadius} borderColor={theme.palette.grey[100]}>
            <legend color={theme.palette.grey[100]}>&nbsp;Add Products&nbsp;</legend>
            <Grid container spacing={2} justifyContent="space-between" alignItems="center">
                <Grid item xs>
                    <BillItemSelection
                        product={selectedProduct}
                        onChange={(p) =>
                            handleProductSelect(p)
                        }
                        otherProps={{
                            variant,
                        }}
                        inputProps={{
                            size,
                            inputRef: productSelectionRef
                        }}
                    />
                </Grid>
                <Grid item style={{ display: selectedProduct ? undefined : "none" }}>
                    <Pulse collapse count={1} when={selectedProduct} >
                        <FormControl
                            variant={variant}
                            size={size}
                        >
                            <InputLabel shrink>Unit</InputLabel>
                            <Select
                                label="Unit"
                                value={selectedProductUnit?.name ?? selectedProduct?.primaryUnit ?? ""}
                                onChange={(e) => {
                                    const value = e.target.value as ValueType<Product["units"]>["name"];
                                    const unit = selectedProduct?.units.find(u => u.name === value) ?? null;
                                    handleProductUnitChange(unit);
                                }}
                            >
                                <MenuItem value={selectedProduct?.primaryUnit ?? ""}>{selectedProduct?.primaryUnit}</MenuItem>
                                {selectedProduct?.units.map(unit =>
                                    <MenuItem key={unit.name} value={unit.name}>{unit.name}</MenuItem>
                                )}
                            </Select>
                        </FormControl>
                    </Pulse>
                </Grid>
                <Grid item container alignItems="center" justifyContent="space-between" spacing={2}>
                    <Grid item xs>
                        <TextField
                            fullWidth
                            label="Quantity"
                            inputRef={quantityRef}
                            size={size}
                            type="number"
                            variant={variant}
                            onKeyDown={handleKeyPress}
                            onFocus={(e) => e.target.select()}
                            inputProps={{
                                min: 0,
                            }}
                            value={selectedProductQuantity || ""}
                            onChange={(e) => setSelectedProductQuantity(Number(e.target.value))}
                        />
                    </Grid>
                    <Grid item xs>
                        <TextField
                            fullWidth
                            label="Price"
                            size={size}
                            type="number"
                            variant={variant}
                            onKeyDown={handleKeyPress}
                            disabled
                            value={selectedProductPrice || ""}
                            onChange={(e) => setSelectedProductPrice(Number(e.target.value))}
                        />
                    </Grid>
                    <Grid item>
                        <Button onClick={() => handleSubmit()} variant="outlined" color="inherit">Add</Button>
                    </Grid>
                </Grid>
            </Grid >
        </Box >
    )
}