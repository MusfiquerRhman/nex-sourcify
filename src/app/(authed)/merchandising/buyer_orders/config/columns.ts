// Configuration for table columns
export const tableHeaders= [
    { key: 'buyer_name', label: 'Buyer Name' },
    { key: 'ref_no', label: 'Reference No' },
    { key: 'department', label: 'Department' },
    { key: 'season', label: 'Season' },
    { key: 'order_date', label: 'Order Date', type: 'date' },
    { key: 'team', label: 'Team' },
    { key: 'status', label: 'Approval Status', type: 'chip', chips: {
            // COMPLETE: { label: 'COMPLETE', type: 'success' },
            INCOMPLETE: { label: 'INCOMPLETE', type: 'error' },
            APPROVED: { label: 'APPROVED', type: 'success' },
            PENDING: { label: 'PENDING', type: 'warning' }
        }
    },
    { key: 'actions', label: '', type: 'action' }
]