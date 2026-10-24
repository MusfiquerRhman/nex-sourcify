export const tableHeaders= [
    { key: 'term_name', label: 'Proceed Type' },
    { key: 'fdbc_no', label: 'FDBC / NexSourcify Invoice No' },
    { key: 'realization_date', label: 'Realization Date', type: 'date' },
    { key: 'rdl_invoice_value', label: 'NexSourcify Invoice Value' },
    { key: 'realized_amount', label: 'Realized Amount' },
    { key: 'factory_paid_amount', label: 'Factory Paid Amount' },
    { key: 'has_cross_payment', label: 'Has Cross Payment', type: 'chip', chips: {
            false: { label: 'NO' },
            true: { label: 'YES', type: 'warning' }
        }
    },
    { key: 'paid_count', label: 'Paid' },
    { key: 'pending_count', label: 'Pending' },
    { key: 'actions', label: '', type: 'action' }
]