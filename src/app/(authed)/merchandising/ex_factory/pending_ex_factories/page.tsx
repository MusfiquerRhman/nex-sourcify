'use client';

import { Form, SearchField, Table, Wrapper } from "~/components";
import React, { useCallback, useState } from "react";
import { api } from "~/trpc/react";
import { useNavigationStore, usePermissionStore } from "~/store";
import { useDebouncedValue, useModulePath, useTablePagination } from "~/hooks";
import { usePendingExFactoryForm } from "./config/usePendingExFactoryForm";
import { skipToken } from "@tanstack/react-query";
import { tableHeaders } from "./config/columns";

const PendingExFactories = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const { methods, formFields, validationError, control } = usePendingExFactoryForm();

    const { page, limit, nextPage, prevPage, setPage } = useTablePagination();

    // Debounced search term
    const debouncedSearch = useDebouncedValue(searchTerm);

    const buyer_id = methods.watch("buyer_id");
    const factory_id = methods.watch("factory_id");
    const from_date = methods.watch("from_date");
    const to_date = methods.watch("to_date");

    // Get current module path
    const modulePath = useModulePath().path;
        
    // Get current module permissions
    const pathId = useNavigationStore((s) => s.getByHref(modulePath));
    const permissions = usePermissionStore(s => (pathId ? s.permission[pathId] : undefined));
    const { can_view } = permissions ?? {};
    

    const { data: pendingExFactories, isLoading: isPendingExFactoriesLoading } = api.exFactory.pendingExfactoryList.useQuery(
        (!!buyer_id && !!factory_id && !!from_date && !!to_date) ? {
            buyer_id: Number(buyer_id),
            factory_id: Number(factory_id),
            from_date: new Date(from_date),
            to_date: new Date(to_date),
            limit,
            offset: page * limit,
        } : skipToken,
    );

    const pendingExFactoryList = pendingExFactories?.results ?? [];
    const total = pendingExFactories?.count ?? 0;

    const toTableData = (rows: unknown[]): Record<string, unknown>[] =>
        rows.map((item) => Object.fromEntries(Object.entries(item as object)));

    const tableData = toTableData(pendingExFactoryList);
    
    // Search query (enabled only when there's a search term)
    const {data: searchQuery, isLoading: isSearchLoading} = api.exFactory.searchPendingExFactories.useQuery(
        { search_term: debouncedSearch, limit, offset: page * limit },
        { enabled: debouncedSearch.length > 0 }
    );

    const searchTableData = toTableData(searchQuery?.results ?? []);
    const searchCount = searchQuery?.count ?? 0;
    const activeTableData = debouncedSearch.length > 0 ? searchTableData : tableData;

    const getAddURL = (row: Record<string, unknown>) => {
        const params = new URLSearchParams({
            order_id: String(row.order_id ?? ''),
            buyer_id: String(row.buyer_id ?? ''),
            factory_id: String(row.factory_id ?? ''),
            payment_term_id: String(row.payment_term_id ?? ''),
        }).toString();

        return `/merchandising/ex_factory/ex_factories/new/?${params}`;
    };

    const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setPage(0); 
        setSearchTerm(event.target.value.trim());
    }, [setPage]);

    return (
        <Wrapper heading='Pending Ex-Factory' >
            <Form 
                fields={formFields} 
                buttonLabel="Add New Ex Factory" 
                register={methods.register}
                validationError={validationError ?? {}}
                control={control}
            />

            <div className="flex flex-col ml-8 mb-4">
                <SearchField
                    placeholder="Search Pending Ex Factories..."
                    infoText="Exfactory No, Buyer Name, Factory Name, PO, Styles, Order References."
                    handleSearchChange={handleSearchChange}
                />
            </div>

           <div className="w-full">
                <Table
                    data={activeTableData}
                    isLoading={isSearchLoading || isPendingExFactoriesLoading}
                    columns={tableHeaders}
                    nextPage={nextPage}
                    prevPage={prevPage}
                    total={debouncedSearch.length > 0 ? searchCount : total}
                    page={page}
                    limit={limit}
                    editURL={''}
                    allowDelete={false}
                    allowEdit={false}
                    allowPrint={false}
                    view={!can_view}
                    allowAdd={true}
                    addURL={getAddURL}
                />
            </div>
        </Wrapper>
    );
}

export default PendingExFactories;