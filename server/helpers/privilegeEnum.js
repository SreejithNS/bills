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
    "ALLOW_BILL_PUT",
    "ALLOW_PRODUCTCATEGORY_GET",
    "ALLOW_CUSTOMER_POST",
    "ALLOW_CUSTOMER_GET",
    "ALLOW_PRODUCT_GET",
    "ALLOW_PAGE_ITEMS",
    "ALLOW_PAGE_BILLS",
    "ALLOW_PAGE_ACCOUNTS",
    "ALLOW_PAGE_HOME",
]