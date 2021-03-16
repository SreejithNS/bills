/**
 * Enum for User Types
 * @readonly
 * @enum {number}
 */
exports.privilegeEnum = {
    root: 0,
    admin: 1,
    salesman: 2
};

/**
 * Default Salesman Permissions
 * @readonly
 */
exports.defaultSalesmanPermissions = [
    "ALLOW_BILL_POST",
    "ALLOW_BILL_GET",
    "ALLOW_CUSTOMER_POST",
    "ALLOW_CUSTOMER_GET",
    "ALLOW_PRODUCT_GET"
]