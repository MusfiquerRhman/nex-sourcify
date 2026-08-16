'use client';

import { Button, Form, Wrapper } from "~/components";
import React, { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";

import { useNavigationStore, usePermissionStore } from "~/store";
import { useModulePath, useModulePermissions } from "~/hooks";

import { useBuyersForm } from "../../config/useBuyersForm";
import TableForm from "~/components/organisms/table/TableForm";
import { type FormValues } from "../../config/formSchema";

import { useConsigneeForm } from "../../consigneeConfig/useConsigneeForm";
import { tableFormColumns as consigneeTableFormColumns } from "../../consigneeConfig/tableFormColumns";
import { type FormValues as ConsigneeFormValues } from "../../consigneeConfig/tableFormSchema";

import { useBanksForm } from "../../banksConfig/useBuyerBankForm";
import { tableFormColumns as bankTableFormColumns } from "../../banksConfig/tableFormColumns";
import { type FormValues as BankFormValues } from "../../banksConfig/tableFormSchema";

import { useClauseForm } from "../../clauseConfig/useClauseForm";
import { tableFormColumns as clauseTableFormColumns } from "../../clauseConfig/tableFormColumns";
import { type FormValues as ClauseFormValues } from "../../clauseConfig/tableFormSchema";

import { usePolicyForm } from "../../latePolicyConfig/useLatePolicyForm";
import { tableFormColumns as latePolicyTableFormColumns } from "../../latePolicyConfig/tableFormColumns";
import { type FormValues as LatePolicyFormValues } from "../../latePolicyConfig/tableFormSchema";
import Brands from "../../components/brands";
import type { BrandsState } from "~/types/merchandising";
import { safeNumber } from "~/utils/numbers";
import type { ParamsProp } from "~/types/params";

const EditBuyerPage = ({ params }: ParamsProp) => {
    const { id } = React.use(params)
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [brands, setBrands] = useState<BrandsState | undefined>();

    // Get current module path
    const modulePath = useModulePath().path;
        
    // Get current module permissions
    const pathId = useNavigationStore((s) => s.getByHref(modulePath));
    const permissions = usePermissionStore(s => (pathId ? s.permission[pathId] : undefined));
    const { can_update } = permissions ?? {};

    const { data: buyerData, isLoading: isLoadingBuyer } = api.buyers.getBuyerById.useQuery({ id: parseInt(id) });
    // Form setup
    const { methods, handleSubmit, formFields, validationError, control, trigger } = useBuyersForm(buyerData?.buyer);
    const {
        register: consigneeRegister,
        handleSubmit: handleConsigneeSubmit,
        tableFormFields: consigneeTableFormFields,
        fields: consigneeFields,
        addRow: consigneeAddRow,
        remove: removeConsignee,
        validationError: consigneeTableValidationError,
        trigger: triggerConsignee
    } = useConsigneeForm(buyerData?.consignee);

    const { 
        register: bankRegister,
        handleSubmit: handleBankSubmit,
        tableFormFields: bankTableFormFields,
        fields: bankFields,
        addRow: bankAddRow,
        remove: removeBank,
        validationError: bankTableValidationError,
        trigger: triggerBanks,
        control: bankControl
    } = useBanksForm(buyerData?.banks);

    const { 
        register: clauseRegister,
        handleSubmit: handleClauseSubmit,
        tableFormFields: clauseTableFormFields,
        fields: clauseFields,
        addRow: clauseAddRow,
        remove: removeClause,
        validationError: clauseTableValidationError,
        trigger: triggerClause
    } = useClauseForm(buyerData?.clause);

    const { 
        register: latePolicyRegister,
        handleSubmit: handleLatePolicySubmit,
        tableFormFields: latePolicyTableFormFields,
        fields: latePolicyFields,
        addRow: latePolicyAddRow,
        remove: removeLatePolicy,
        validationError: latePolicyTableValidationError,
        trigger: triggerLatePolicy
    } = usePolicyForm(buyerData?.latePolicy);

    const utils = api.useUtils();

    const updateBuyer = api.buyers.updateBuyer.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Buyer updated successfully!");
            await utils.buyers.getBuyers.invalidate();
            await utils.buyers.getBuyerById.invalidate({ id: parseInt(id) });
            setIsLoading(false);
        },
    });

    useEffect(() => {
        setBrands({ buyer_brands: buyerData?.buyer?.buyer_brands ?? [] });
    }, [buyerData]);

    const submitAll = async () => {
        setIsLoading(true);

        try {
            let buyerData: FormValues | undefined;
            let consigneeData: ConsigneeFormValues[] | undefined;
            let bankData: BankFormValues[] | undefined;
            let clauseData: ClauseFormValues[] | undefined;
            let latePolicyData: LatePolicyFormValues[] | undefined;

            await trigger();
            await triggerConsignee();
            await triggerBanks();
            await triggerClause();
            await triggerLatePolicy();

            await handleSubmit(
                (data) => {
                    buyerData = data;
                },
                (errors) => {
                    toast.error(`Please fix the validation errors before submitting. ${JSON.stringify(errors)}`);
                    throw new Error(JSON.stringify(errors));
                }
            )();

            await handleConsigneeSubmit(
                (data) => {
                    consigneeData = data.consignees;
                },
                (errors) => {
                    toast.error(`Please fix the validation errors before submitting. ${JSON.stringify(errors)}`);
                    throw new Error(JSON.stringify(errors)); 
                }
            )();

            await handleBankSubmit(
                (data) => {
                    bankData = data.banks;
                },
                (errors) => {
                    toast.error(`Please fix the validation errors before submitting. ${JSON.stringify(errors)}`);
                    throw new Error(JSON.stringify(errors)); 
                }
            )();

            await handleClauseSubmit(
                (data) => {
                    clauseData = data.clause;
                },
                (errors) => {
                    toast.error(`Please fix the validation errors before submitting. ${JSON.stringify(errors)}`);
                    throw new Error(JSON.stringify(errors)); 
                }
            )();

            await handleLatePolicySubmit(
                (data) => {
                    latePolicyData = data.policy;
                },
                (errors) => {
                    toast.error(`Please fix the validation errors before submitting. ${JSON.stringify(errors)}`);
                    throw new Error(JSON.stringify(errors)); 
                }
            )();

            const payload = {
                id: parseInt(id),
                ...buyerData,
                prefix: buyerData?.prefix ?? "",
                buyer_name: buyerData?.buyer_name ?? "",
                short_name: buyerData?.short_name ?? "",
                country_id: buyerData?.country_id ? safeNumber(buyerData.country_id) : undefined,
                overseas_office_id: buyerData?.overseas_office_id ? safeNumber(buyerData.overseas_office_id) : undefined,
                consignee: consigneeData ? consigneeData.map((consignee, index) => ({
                    db_id: consignee.db_id,
                    sl_no: index + 1,
                    consignee_name: consignee.consignee_name,
                    address: consignee.address,
                })) : [],
                banks: bankData ? bankData.map((bank, index) => ({
                    db_id: bank.db_id,
                    sl_no: index + 1,
                    bank_id: safeNumber(bank.bank_id),
                    branch_name: bank.branch_name,
                    account_no: bank.account_no,
                    account_name: bank.account_name,
                    swift: bank.swift,
                    address: bank.address,
                })) : [],
                clause: clauseData ? clauseData.map((clause, index) => ({
                    db_id: clause.db_id,
                    sl_no: index + 1,
                    description: clause.description,
                })) : [],
                policy: latePolicyData ? latePolicyData.map((policy, index) => ({
                    db_id: policy.db_id,
                    sl_no: index + 1,
                    description: policy.description,
                })) : [],
                buyer_brands: brands?.buyer_brands ?? [],
            };

            await updateBuyer.mutateAsync(payload);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error updating Buyer: ${message}`);
            setError(message);
        }
        finally {
            setIsLoading(false);
        }
    };

    const deleteConsignee = api.buyers.deleteConsignee.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Buyer consignee deleted successfully!");
            await utils.buyers.getBuyerById.invalidate({ id: parseInt(id) });
        }
    });

    const deleteBank = api.buyers.deleteBank.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Buyer bank deleted successfully!");
            await utils.buyers.getBuyerById.invalidate({ id: parseInt(id) });
        },
    });

    const deleteClause = api.buyers.deleteClause.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Buyer clause deleted successfully!");
            await utils.buyers.getBuyerById.invalidate({ id: parseInt(id) });
        },
    });

    const deleteLatePolicy = api.buyers.deleteLatePolicy.useMutation({
        onSuccess: async () => {
            setError(null);
            toast.success("Buyer late delivery policy deleted successfully!");
            await utils.buyers.getBuyerById.invalidate({ id: parseInt(id) });
        },
    });

    const removeConsigneeRow = async (index: number) => {
        try {
            if(!!consigneeFields[index]?.db_id){
                await deleteConsignee.mutateAsync({ id: consigneeFields[index].db_id });
            }
            
            removeConsignee(index);
        }
        catch (error) {
            setError("Error removing consignee row: " + (error as Error).message);
        }
    }

    const removeBankRow = async (index: number) => {
        try {
            if(!!bankFields[index]?.db_id){
                await deleteBank.mutateAsync({ id: bankFields[index].db_id });
            }
    
            removeBank(index);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error deleting buyer bank: ${message}`);
            setError(message);
        }
        finally {
            setIsLoading(false);
        }
    }

    const removeClauseRow = async (index: number) => {
        try {
            if(!!clauseFields[index]?.db_id){
                await deleteClause.mutateAsync({ id: clauseFields[index].db_id });
            }
            
            removeClause(index);
        }
        catch (error) {
            const message = parseTRPCError(error);
            toast.error(`Error deleting buyer late delivery policy: ${message}`);
            setError(message)
        }
        finally {
            setIsLoading(false);
        }
    }

    const removeLatePolicyRow = async (index: number) => {
        try {
            if(!!latePolicyFields[index]?.db_id){
                await deleteLatePolicy.mutateAsync({ id: latePolicyFields[index].db_id });
            }
            
            removeLatePolicy(index);
        }
        catch (error) {
            setError("Error removing policy row: " + (error as Error).message);
        }
        finally {
            setIsLoading(false);
        }
    }

    const { can_delete } = useModulePermissions();

    return (
         <Wrapper heading="Update Buyer">
            <Form fields={formFields} 
                buttonLabel="Update Buyer" 
                control={control}
                register={methods.register}
                isLoading={isLoading || isLoadingBuyer}
                validationError={validationError}
                disabled={!can_update}
                error={error}
            />
            <TableForm 
                title={"Buyer Consignees"}
                name="consignees"
                isLoading={isLoading}
                fields={consigneeTableFormFields}
                rows={consigneeFields}
                columns={consigneeTableFormColumns}
                register={consigneeRegister}
                disabled={!can_update}
                addRow={consigneeAddRow}
                removeRow={removeConsigneeRow}
                validationError={consigneeTableValidationError.consignees}
                canDelete={can_delete}
            />
            <TableForm 
                title={"Buyer Banks"}
                name="banks"
                isLoading={isLoading}
                fields={bankTableFormFields}
                disabled={!can_update}
                rows={bankFields}
                columns={bankTableFormColumns}
                register={bankRegister}
                addRow={bankAddRow}
                removeRow={removeBankRow}
                validationError={bankTableValidationError.banks}
                control={bankControl}
                canDelete={can_delete}
            />
            <TableForm 
                title={"Buyer Additional Clauses"}
                name="clause"
                isLoading={isLoading}
                fields={clauseTableFormFields}
                disabled={!can_update}
                rows={clauseFields}
                columns={clauseTableFormColumns}
                register={clauseRegister}
                addRow={clauseAddRow}
                removeRow={removeClauseRow}
                validationError={clauseTableValidationError.clause}
                canDelete={can_delete}
            />
            <TableForm 
                title={"Buyer Late Delivery Policies"}
                name="policy"
                isLoading={isLoading}
                fields={latePolicyTableFormFields}
                disabled={!can_update}
                rows={latePolicyFields}
                columns={latePolicyTableFormColumns}
                register={latePolicyRegister}
                addRow={latePolicyAddRow}
                removeRow={removeLatePolicyRow}
                validationError={latePolicyTableValidationError.policy}
                canDelete={can_delete}
            />
            <Brands brands={brands} setBrands={setBrands} canDelete={can_delete} />
            <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => submitAll()}
                    label={"Update Buyer"} 
                    className="text-lg tracking-wide m-8 max-w-80"
                    disabled={isLoading || isLoadingBuyer || !can_update}
                />
            </div>
        </Wrapper>
    );
}

export default EditBuyerPage;