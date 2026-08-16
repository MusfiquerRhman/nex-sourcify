// Configuration for table columns
export const tableHeaders= [
    { key: 'ref_no', label: 'Order Ref' },
    { key: 'buyer_name', label: 'Buyer Name' },
    { key: 'plan_date', label: 'Distribution Date', type: 'date' },
    { key: 'approval_status', label: 'Approval Status', type: 'chip', chips: {
            true: { label: 'APPROVED', type: 'success' },
            false: { label: 'PENDING', type: 'error' },
        }
    },
    { key: 'actions', label: '', type: 'action' }
]