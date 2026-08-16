// Configuration for table columns
export const tableHeaders= [
    { key: 'name', label: 'Product Name' },
    { key: 'product_type_name', label: 'Product Type' },
    { key: 'is_active', label: 'Is Active', type: 'chip',
        chips: {
            true: { label: 'Active', type: 'success' },
            false: { label: 'Inactive', type: 'error' }
        } 
     },
    { key: 'actions', label: '', type: 'action' },
];