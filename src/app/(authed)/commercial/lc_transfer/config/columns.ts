/**
 * @description
 * This file defines the column configurations for the TransferTableForm component, which is used to render the table of LC Transfer entries in the LC Transfer form.
 * The column configurations include the key, label, and type for each column in the table, which are used to render the appropriate input fields for each column in the TransferTableForm component.
 * 
 * The columns include:
 * - lc_no: Displays the LC number associated with the LC Transfer entry.
 * - buyer_name: Displays the name of the buyer associated with the LC Transfer entry.
 * - lc_open_date: Displays the date when the LC was opened, which is selected by the user.
 * - lc_transfer_date: Displays the date of the LC transfer, which is selected by the user.
 * - Actions: Displays action buttons for editing or deleting the LC Transfer entry.
 */

export const tableHeaders= [
    { key: 'lc_no', label: 'LC No' },
    { key: 'buyer_name', label: 'Buyer Name' },
    { key: 'lc_open_date', label: 'LC Open Date', type: 'date' },
    { key: 'lc_transfer_date', label: 'LC Transfer Date', type: 'date' },
    { key: 'actions', label: '', type: 'action' }
]