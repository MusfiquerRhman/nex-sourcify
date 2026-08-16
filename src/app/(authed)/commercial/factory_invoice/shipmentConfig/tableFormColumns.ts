export const tableFormColumns = [
    { key: 'checked', label: 'Checked', type: 'checkbox' },
    { key: 'order_no', label: 'Order No' },
    { key: 'style', label: 'Style' },
    { key: 'po', label: 'PO' },
    { key: 'exfactory_date', label: 'Ex-Factory Date', type: 'date' },
    { key: 'destination', label: 'Destination' },
    { key: 'order_quantity', label: 'Order Quantity' },
    { key: 'delivery_quantity', label: 'Delivery Quantity' },
    { key: 'factory_fob', label: 'Factory FOB' },
    { key: 'factory_value', label: 'Factory Value' },
];

export const tableColumnsWithoutCheckbox = [
    ...tableFormColumns.filter(column => column.key !== 'checked'),
    { key: 'actions', label: '', type: 'action' },
];