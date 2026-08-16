// Configuration for table columns
export const tableHeaders= [
    { key: 'exfactory_no', label: 'Ex Factory No' },
    { key: 'exfactory_date', label: 'Ex Factory Date', type: 'date' },
    { key: 'buyer_name', label: 'Buyer Name' },
    { key: 'styles', label: 'Style' },
    { key: 'pos', label: 'PO' },
    { key: 'is_authorized', label: 'Status', type: 'chip', chips: {
            true: { label: 'AUTHORIZED', type: 'success' },
            false: { label: 'UNAUTHORIZED', type: 'error' },
        }
    },
    { key: 'actions', label: '', type: 'action' }
]