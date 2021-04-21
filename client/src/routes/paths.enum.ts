export enum paths {
    home = '/',
    customer = '/customers',
    billsHome = '/bills',
    items = "/items",
    account = "/account"
}

export enum billsPaths {
    home = '/',
    billDetail = '/open/:id',
    addBill = '/create'
}

export enum customersPaths {
    home = '/',
    createCustomer = '/create',
    customerViewer = "/view/:id"
}

export enum itemPaths {
    home = '/',
    addItem = '/create',
    editCategory = '/category/edit/:productCategoryId',
    editProduct = '/product/edit/:productId',
    import = '/import'
}

export enum accountPaths {
    home = '/',
    addSalesman = '/salesman/add',
    editSalesman = '/salesman/edit/:id'
}