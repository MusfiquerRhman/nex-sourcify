// Configuration for table columns
export const tableHeaders= [
    { key: 'buyer_name', label: 'Buyer Name' },
    { key: 'lc_no', label: 'LC No' },
    { key: 'lc_open_date', label: 'LC Open Date', type: 'date' },
    { key: 'lc_received_date', label: 'LC Received Date', type: 'date' },
    { key: 'lc_value', label: 'LC Value' },
    { key: 'amendment_no', label: 'Amendment No' },
    { key: 'status', label: 'Approval Status', type: 'chip', chips: {
            false: { label: 'UNAUTHORIZED', type: 'error' },
            true: { label: 'AUTHORIZED', type: 'success' }
        }
    },
    { key: 'actions', label: '', type: 'action' }
];