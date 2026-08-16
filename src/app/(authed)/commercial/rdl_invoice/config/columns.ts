export const tableHeaders= [
    { key: 'buyer_name', label: 'Buyer Name' },
    { key: 'invoice_no', label: 'Invoice No' },
    { key: 'invoice_date', label: 'Invoice Date', type: 'date' },
    { key: 'value', label: 'Value' },
    { key: 'is_authorized', label: 'Approval Status', type: 'chip', chips: {
            false: { label: 'UNAUTHORIZED', type: 'error' },
            true: { label: 'AUTHORIZED', type: 'success' }
        }
    },
    { key: 'actions', label: '', type: 'action' }
]