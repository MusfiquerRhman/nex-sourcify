// Configuration for table columns
export const tableHeaders= [
    { key: 'sales_contract_no', label: 'Sales Contract No' },
    { key: 'sales_contract_date', label: 'Sales Contract Date', type: 'date' },
    { key: 'sales_contract_value', label: 'Sales Contract Value' },
    { key: 'factory_name', label: 'Factory Name' },
    { key: 'approval_status', label: 'Approval Status', type: 'chip', chips: {
            0: { label: 'UNAUTHORIZED', type: 'error' },
            1: { label: 'READY FOR APPROVAL', type: 'warning' },
            2: { label: 'AUTHORIZED', type: 'success' }
        }
    },
    { key: 'amendment_no', label: 'Amendment No' },
    { key: 'actions', label: '', type: 'action' }
];