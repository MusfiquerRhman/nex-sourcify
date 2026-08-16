/**
 * @description
 * This file defines the column configurations for the TransferTableForm component, which is used to render the table of LC Transfer entries in the LC Transfer form.
 * The column configurations include the key, label, and type for each column in the table, which are used to render the appropriate input fields for each column in the TransferTableForm component.
 * 
 * The columns include:
 * - Factory: Displays the name of the factory associated with the LC Transfer entry.
 * - Sales Contract: Displays the sales contract number associated with the LC Transfer entry.
 * - Total Quantity: Displays the total quantity for the selected sales contract.
 * - Previous Transfer Quantity: Displays the total quantity transferred in previous transfers for the selected sales contract.
 * - Transfer Quantity: Displays the quantity to be transferred in the current transfer, which is entered by the user.
 * - Total Value: Displays the total value for the selected sales contract.
 * - Previous Transfer Value: Displays the total value transferred in previous transfers for the selected sales contract.
 * - Transfer Value: Displays the value to be transferred in the current transfer, which is entered by the user.
 * - Transfer Date: Displays the date of the transfer, which is selected by the user.
 * - Actions: Displays action buttons for editing or deleting the LC Transfer entry.
 */

export const tableFormColumns = [
    { key: 'factory_id', label: 'Factory' },
    { key: 'sales_contract_id', label: 'Sales Contract' },
    { key: 'total_quantity', label: 'Total Quantity' },
    { key: 'previous_transfer_quantity', label: 'Previous Transfer Quantity' },
    { key: 'transfer_quantity', label: 'Transfer Quantity' },
    { key: 'total_value', label: 'Total Value' },
    { key: 'previous_transfer_value', label: 'Previous Transfer Value' },
    { key: 'transfer_value', label: 'Transfer Value' },
    { key: 'transfer_date', label: 'Transfer Date' },
    { key: 'actions', label: '', type: 'action' }
]