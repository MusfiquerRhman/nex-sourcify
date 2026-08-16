// Define table headers, keys must match database fields
// Configuration for table columns
export const tableHeaders= [
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'user_id', label: 'User ID' },
    { key: 'password', label: 'Password', type: 'password' },
    { key: 'department_name', label: 'Department' },
    { key: 'level_name', label: 'Level' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'phone_no', label: 'Phone No' },
    { key: 'is_active', label: 'Active', type: 'chip', chips: {
        true: { label: 'Yes', type: 'success' },
        false: { label: 'No', type: 'error' }
    } },
    { key: 'actions', label: '', type: 'action'}
];
