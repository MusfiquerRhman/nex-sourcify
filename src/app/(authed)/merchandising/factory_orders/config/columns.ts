// Configuration for table columns
export const tableHeaders= [
    { key: 'ref_no', label: 'Reference No' },
    { key: 'buyer_name', label: 'Buyer Name' },
    { key: 'factory_name', label: 'Factory Name' },
    { key: 'order_date', label: 'Order Date', type: 'date' },
    { key: 'factory_order_date', label: 'Factory Order Date', type: 'date' },
    { key: 'department', label: 'Department' },
    { key: 'approval_status', label: 'Approval Status', type: 'chip', chips: {
            '-1': { label: 'INCOMPLETE', type: 'error' },
            '0': { label: 'PENDING', type: 'warning' },
            '1': { label: 'LEVEL 1 APPROVED', type: 'info' },
            '2': { label: 'APPROVED', type: 'success' }
        }
    },
    { key: 'actions', label: '', type: 'action' }
];