// Configuration for table columns
export const tableHeaders= [
    { key: 'buyer_name', label: 'Buyer Name' },
    { key: 'ref_no', label: 'Reference No' },
    { key: 'department', label: 'Department' },
    { key: 'season', label: 'Season' },
    { key: 'order_date', label: 'Order Date', type: 'date' },
    { key: 'team', label: 'Team' },
    { key: 'status', label: 'Status', type: 'chip', chips: {
            APPROVED: { label: 'APPROVED', type: 'success' },
            INCOMPLETE: { label: 'INCOMPLETE', type: 'error' },
            PENDING: { label: 'PENDING', type: 'warning' }
        }
    },
    { key: 'actions', label: '', type: 'action' }
]