'use client';

import React, { useState } from "react";
import { toast } from "sonner";
import { Button, Form, Loader, Wrapper } from "~/components";
import { useModulePermissions } from "~/hooks";
import { api } from "~/trpc/react";
import type { ParamsProp } from "~/types/params";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useEditPreProductionMeetingForm, type PPMeeting } from "../../config/useEditPreProductionMeetingForm";
import ProductionPlans from "../../components/productionPlans/ProductionPlans";
import ApprovalStatus from "../../components/approvalStatus/ApprovalStatus";
import PhotoContainer from "../../components/photoComponents/PhotoContainer";
import OverallComments from "../../components/OverallComments";
import ProductRiskAssessment from "../../components/ProductRiskAssessment";
import AttendancePhoto from "../../components/photoComponents/AttendancePhoto";
import Guidelines from "~/app/(authed)/merchandising/buyer_orders/components/photoComponents/Guidelines";
import { printingWhiteIcon } from "~/assets";

type EditorProps = {
    meeting: PPMeeting;
};

const PreProductionMeetingEditor = (props: EditorProps) => {
    const { meeting } = props;

    const [error, setError] = useState<string | null>(null);
    const { can_update, can_view } = useModulePermissions();
    const utils = api.useUtils();
    const { methods, formFields } = useEditPreProductionMeetingForm(meeting);
    const updatePPMeeting = api.ppMeeting.updatePPMeeting.useMutation();
    const { errors: validationError, isSubmitting } = methods.formState;
    const isSaving = isSubmitting || updatePPMeeting.isPending;

    const onSubmit = methods.handleSubmit(async (values) => {
        if (!can_update || updatePPMeeting.isPending) return;

        setError(null);

        try {
            await updatePPMeeting.mutateAsync({
                id: meeting.id,
                meeting_date: values.meeting_date,
                daily_production_plan: values.daily_production_plan,
                overall_comments: values.overall_comments,
                productionPlans: values.productionPlans.map((plan) => ({
                    id: plan.db_id,
                    cutting_date: plan.cutting_date ?? '',
                    sewing_date: plan.sewing_date ?? '',
                    finishing_date: plan.finishing_date ?? '',
                    plan_inspection_date: plan.plan_inspection_date ?? '',
                })),
                approvalStatus: values.approvalStatus.map((approval) => ({
                    id: approval.db_id,
                    approval_status: approval.approval_status,
                })),
            });
        } catch (error) {
            const message = parseTRPCError(error);
            setError(message);
            toast.error(`Failed to update Pre Production Meeting: ${message}`);
            return;
        }

        toast.success('Pre Production Meeting updated successfully!');
        void utils.ppMeeting.invalidate();
    });

    return (
        <Wrapper heading={can_update ? 'Update Pre Production Meeting' : 'View Pre Production Meeting'}
            subSectionRight={
                can_view ? (
                    <div className="w-50 mb-3">
                        <Button
                            variant="secondary"
                            label="Print (PDF)"
                            leftIcon={printingWhiteIcon}
                            onClick={() => window.open(`/pdf/pp_meeting/${meeting.id}`, "_blank")}
                        />
                    </div>
                ) : null
            }>
            <Form
                fields={formFields}
                buttonLabel="Update Pre Production Meeting"
                register={methods.register}
                validationError={validationError}
                error={error}
                control={methods.control}
                disabled={!can_update || isSaving}
            />

            <ProductionPlans
                methods={methods}
                disabled={!can_update || isSaving}
            />

            <ApprovalStatus
                methods={methods}
                disabled={!can_update || isSaving}
            />

            <PhotoContainer
                meetingId={meeting.id}
                ppsImages={meeting.ppsImages}
                sizeSetImages={meeting.sizeSetImages}
                disabled={!can_update || isSaving}
            />

            <OverallComments methods={methods} disabled={!can_update || isSaving} />

            <ProductRiskAssessment />

            <AttendancePhoto meetingId={meeting.id} photo={meeting.attendance_list_photo} disabled={!can_update || isSaving} />

            {can_update && (
                <div className="flex w-full justify-end p-8">
                    <Button
                        type="button"
                        label="Update Pre Production Meeting"
                        onClick={() => onSubmit()}
                        className="max-w-80 text-lg tracking-wide"
                        disabled={isSaving}
                    />
                </div>
            )}

            {can_update && (
                <section className="mx-8 mb-8" aria-label="Image Upload Guidelines">
                    <Guidelines />
                </section>
            )}
        </Wrapper>
    );
};

const EditPreProductionMeetingPage = (props: ParamsProp) => {
    const { params } = props;
    const { id } = React.use(params);

    const { data: meeting, isLoading, error } = api.ppMeeting.getPPMeetingById.useQuery({ id });

    if (isLoading) return <Wrapper heading="Pre Production Meeting"><Loader /></Wrapper>;

    if (error || !meeting) {
        return (
            <Wrapper heading="Pre Production Meeting">
                <p role="alert" className="p-8 text-red-500">{error?.message ?? 'Pre Production Meeting not found.'}</p>
            </Wrapper>
        );
    }

    return <PreProductionMeetingEditor key={meeting.id} meeting={meeting} />;
};

export default EditPreProductionMeetingPage;
