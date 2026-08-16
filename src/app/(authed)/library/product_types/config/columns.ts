// Configuration for table columns
export const tableHeaders= [
    { key: 'name', label: 'Name' },
    { key: 'is_active', label: 'Active', type: 'chip',
        chips: {
            true: { label: 'Active', type: 'success' },
            false: { label: 'Inactive', type: 'error' }
        } 
     },
    { key: 'actions', label: '', type: 'action'}
];