'use client';

import { Button, Form, Wrapper } from "~/components";
import React, { useState } from "react";
import { useCompaniesForm } from "../../config/useCompaniesForm";
import { api } from "~/trpc/react";
import { toast } from 'sonner';
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useNavigationStore, usePermissionStore } from "~/store";
import { useModulePath, useModulePermissions } from "~/hooks";
import { useCompanyBanksForm } from "../../bankConfig/useCompanyBanksForm";
import TableForm from "~/components/organisms/table/TableForm";

import { type FormValues as BankFormValues } from "../../bankConfig/tableFormSchema";
import { tableFormColumns } from "../../bankConfig/tableFormColumns";
import type { FormValues } from "../../config/formSchema";
import type { ParamsProp } from "~/types/params";

const EditCompanyPage = ({ params }: ParamsProp) => {
    const { id } = React.use(params)
    const [error, setError] = useState<string | null>(null);

    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

    // Get current module path
    const modulePath = useModulePath().path;
        
    // Get current module permissions
    const pathId = useNavigationStore((s) => s.getByHref(modulePath));
    const permissions = usePermissionStore(s => (pathId ? s.permission[pathId] : undefined));
    const { can_update } = permissions ?? {};
    
    const { data: companyData, isLoading } = api.companies.getCompanyById.useQuery({ id });
    // Form setup
    const { methods, handleSubmit, formFields, validationError, trigger: companyTrigger, control } = useCompaniesForm(companyData?.company);
    const { 
        register,
        handleSubmit: handleBanksSubmit,
        tableFormFields,
        fields,
        addRow,
        remove,
        validationError: tableValidationError,
        trigger: bankTrigger,
        control: bankControl,
    } = useCompanyBanksForm(companyData?.companyBanks);
    // TRPC utils
    const utils = api.useUtils();

    const updateCompany = api.companies.updateCompany.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Company updated successfully!");
            await utils.companies.getCompanies.invalidate();
            await utils.companies.getCompanyById.invalidate({ id });
        },
    });

    const submitALl = async () => {
        setIsLoadingSubmit(true);

        try {
            let companyData: FormValues = {} as FormValues; // Initialize with an empty object
            let bankData: BankFormValues[] = [];

            // Trigger validation for both forms
            await companyTrigger();
            await bankTrigger();

            // Collect data from both forms
            await handleSubmit(
                (data) => {
                    companyData = data;
                },
                (errors) => {
                    toast.error(`Please fix the validation errors before submitting. ${JSON.stringify(errors)}`);
                    throw new Error("Validation errors in company form");
                }
            )();

            await handleBanksSubmit(
                (data) => {
                    bankData = data.banks;
                },
                (errors) => {
                    toast.error(`Please fix the validation errors before submitting. ${JSON.stringify(errors)}`);
                    throw new Error("Validation errors in banks form"); 
                }
            )();

            const payload = {
                id: parseInt(id),
                ...companyData,
                currencies_id: Number(companyData.currencies_id),
                country_id: Number(companyData.country_id),
                company_banks: bankData.map(bank => ({
                    db_id: bank.db_id,
                    bank_id: Number(bank.bank_id),
                    branch_name: bank.branch_name,
                    account_no: bank.account_no,
                    account_name: bank.account_name,
                    swift: bank.swift,
                    address: bank.address,
                })),
            };

            await updateCompany.mutateAsync(payload);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error updating company: ${message}`);
            setError(message);
        }
        finally {
            setIsLoadingSubmit(false);
        }
    };

    const deleteBank = api.companies.deleteCompanyBank.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Company bank deleted successfully!");
            await utils.companies.getCompanyById.invalidate({ id });
        },
    });

    const removeRow = async (index: number) => {
        try {
            if(!!fields[index]?.db_id){
                await deleteBank.mutateAsync({ id: fields[index].db_id });
            }

            remove(index);
        }
        catch (error) {
            setError("Error removing bank row: " + (error as Error).message);
        }
    }

    const { can_delete } = useModulePermissions();

    return (
        <Wrapper heading="Update Company">
            <Form fields={formFields} 
                buttonLabel="Update Company" 
                register={methods.register} 
                validationError={validationError} 
                isLoading={isLoadingSubmit || isLoading}
                error={error}
                disabled={!can_update}
                control={control}
            />
            <TableForm 
                name='banks'
                title={"Factory Banks"}
                canDelete={can_delete}
                fields={tableFormFields}
                rows={fields}
                columns={tableFormColumns}
                register={register}
                addRow={addRow}
                removeRow={removeRow}
                validationError={tableValidationError?.banks}
                disabled={!can_update}
                control={bankControl}
            />
            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => submitALl()}
                    label={"Submit"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading}
                />
            </div>
        </Wrapper>
    );
}

export default EditCompanyPage;