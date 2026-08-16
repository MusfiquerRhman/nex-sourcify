'use client';

import { plusIcon } from "~/assets";
import { useRouter } from 'next/navigation';
import { Table, Wrapper, Button, SearchField } from "~/components";
import { api } from "~/trpc/react";
import { tableHeaders } from "./config/columns";
import { useCallback, useState } from "react";
import { useNavigationStore, usePermissionStore } from "~/store";
import { useDebouncedValue, useModulePath, useTablePagination } from "~/hooks";

const UserPage = () => {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');

    // Debounced search term
    const debouncedSearch = useDebouncedValue(searchTerm);

    // Get current module path
    const modulePath = useModulePath().path;
        
    // Get current module permissions
    const pathId = useNavigationStore((s) => s.getByHref(modulePath));
    const permissions = usePermissionStore(s => (pathId ? s.permission[pathId] : undefined));
    const { can_add, can_update } = permissions ?? {};


    // Frontend pagination state and handlers
    const { page, limit, nextPage, prevPage, setPage } = useTablePagination();
    
    // Fetch users data
    const { data: usersData, isLoading } = api.users.getUsers.useQuery({
        limit,
        offset: page * limit,
    });

    const users = usersData?.users ?? [];
    const total = usersData?.total ?? 0;

    // Search query
    // Search query (enabled only when there's a search term)
    const searchQuery = api.users.searchUsers.useQuery(
        { query: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setPage(0); 
        setSearchTerm(event.target.value.trim());
    }, [setPage]);

    const editURL = '/admin/users/edit/';

    return (
        <Wrapper heading='User Management'
            subSectionLeft={
                <SearchField placeholder="Search Users" handleSearchChange={handleSearchChange} 
                    infoText="First Name, Last Name, User ID, Department, Level, Phone No and Email."
                />
            }
            subSectionRight={
                can_add && <div className="w-56">
                    <Button variant="secondary" 
                        label="Add New User" 
                        leftIcon={plusIcon} 
                        onClick={() => router.push('/admin/users/new')} 
                        disabled={!can_add}
                    />
                </div>
            }
        >
            <div className="w-full">
                <Table data={searchQuery.data?.users && !!debouncedSearch 
                        ? searchQuery.data.users : users
                    } 
                    isLoading={isLoading} 
                    columns={tableHeaders} 
                    nextPage={nextPage} 
                    prevPage={prevPage}
                    total={searchQuery.data?.users && searchQuery.data.users.length > 0 ? searchQuery.data.total ?? 0 : total}
                    page={page}
                    limit={limit}
                    editURL={editURL}
                    allowDelete={false}
                    allowEdit={can_update}
                />
            </div>
        </Wrapper>
    )
}

export default UserPage;