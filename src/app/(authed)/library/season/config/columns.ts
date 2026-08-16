// Configuration for table columns
export const tableHeaders= [
    { key: 'season_name', label: 'Season Name' },
    { key: 'buyer_name', label: 'Buyer' },
    { key: 'active_status', label: 'Active', type: 'chip',
        chips: {
            true: { label: 'Active', type: 'success' },
            false: { label: 'Inactive', type: 'error' }
        } 
     },
    { key: 'actions', label: '', type: 'action'}
];