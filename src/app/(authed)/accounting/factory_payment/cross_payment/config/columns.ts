export const tableHeaders = [
    { key: 'cross_payment_ref', label: 'Cross Payment Reference' },
    { key: 'buyer_name', label: 'Buyer Name' },
    { key: 'term_name', label: 'Term' },
    { key: 'cross_payment_date', label: 'Payment Date', type: 'date' },
    { key: 'paid_amount', label: 'Paid Amount' },
    { key: 'is_authorized', label: 'Authorization', type: 'chip', chips: {
            true: { label: 'AUTHORIZED', type: 'success' },
            false: { label: 'UNAUTHORIZED', type: 'error' },
        }
    },
    { key: 'actions', label: '', type: 'action' }
]