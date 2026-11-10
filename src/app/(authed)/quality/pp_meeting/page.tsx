'use client';

import { useRouter } from "next/navigation";
import { plusIcon } from "~/assets";
import { Button, SearchField, Table, Wrapper } from "~/components";
import { api } from "~/trpc/react";
import { tableHeaders } from "./config/columns";
import { useSearchablePagination, useModulePermissions } from "~/hooks";

const PreProductionMeetingList = () => {
    const router = useRouter();
    const { page, limit, debouncedSearch, handleSearchChange, nextPage, prevPage } = useSearchablePagination();

    const { can_add, can_update, can_delete } = useModulePermissions();

    const meetingsQuery = api.ppMeeting.getPPMeetings.useQuery({
        limit,
        offset: page * limit,
        query: debouncedSearch,
    });

    const meetings = meetingsQuery.data?.meetings ?? [];
    const total = meetingsQuery.data?.total ?? 0;

    const editURL = '/quality/pp_meeting/edit';
    const printURL = `/pdf/pp_meeting`;

    return (
        <Wrapper
            heading="Pre Production Meeting"
            subSectionLeft={
                <SearchField
                    placeholder="Search Pre Production Meeting..."
                    infoText="Buyer Name, Order Reference, Style, PO, and Factory Name."
                    handleSearchChange={handleSearchChange}
                />
            }
            subSectionRight={
                can_add ? (
                    <div className="w-70">
                        <Button
                            variant="secondary"
                            label="Add Pre Production Meeting"
                            leftIcon={plusIcon}
                            onClick={() => router.push('/quality/pp_meeting/new')}
                        />
                    </div>
                ) : null
            }
        >
            <div className="w-full">
                {meetingsQuery.error ? (
                    <p role="alert" className="p-4 text-red-500">{meetingsQuery.error.message}</p>
                ) : (
                    <Table
                        data={meetings}
                        isLoading={meetingsQuery.isLoading}
                        columns={tableHeaders}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        total={total}
                        page={page}
                        limit={limit}
                        editURL={editURL}
                        allowDelete={can_delete}
                        allowEdit={can_update}
                        view={!can_update}
                        allowPrint={true}
                        printURL={printURL}
                    />
                )}
            </div>
        </Wrapper>
    );
};

export default PreProductionMeetingList;
