import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { RouterOutputs } from "~/trpc/react";
import type { BaseField } from "~/types/form";
import { editPreProductionMeetingFormSchema, type EditPreProductionFormValues } from "./formSchema";

export type PPMeeting = RouterOutputs['ppMeeting']['getPPMeetingById'];

export const useEditPreProductionMeetingForm = (meeting: PPMeeting) => {
    const methods = useForm<EditPreProductionFormValues>({
        resolver: zodResolver(editPreProductionMeetingFormSchema),
        defaultValues: {
            meeting_date: meeting.meeting_date?.toISOString().slice(0, 10) ?? '',
            overall_comments: meeting.overall_comments ?? '',
            factory_name: meeting.factory_name,
            ref_no: meeting.ref_no,
            style: meeting.style,
            first_shipment_date: meeting.first_shipment_date?.toISOString().slice(0, 10) ?? '',
            item: meeting.item,
            fabric_description: meeting.fabric_description,
            required_gsm: meeting.required_gsm,
            order_quantity: meeting.order_quantity,
            size_range: meeting.size_range,
            color_names: meeting.color_names,
            daily_production_plan: meeting.daily_production_plan ?? undefined,
            productionPlans: meeting.productionPlans.map((plan) => ({
                db_id: plan.id,
                color_name: plan.color_name,
                po_no: plan.po_no,
                size: plan.size,
                order_quantity: plan.order_quantity,
                cutting_date: plan.cutting_date?.toISOString().slice(0, 10) ?? '',
                sewing_date: plan.sewing_date?.toISOString().slice(0, 10) ?? '',
                finishing_date: plan.finishing_date?.toISOString().slice(0, 10) ?? '',
                plan_inspection_date: plan.plan_inspection_date?.toISOString().slice(0, 10) ?? '',
            })),
            approvalStatus: meeting.approvalStatus.map((approval) => ({
                db_id: approval.id,
                status_name: approval.status_name,
                approval_status: approval.approval_status === 1 || approval.approval_status === 0 ? approval.approval_status : -1,
            })),
        },
    });

    const formFields: BaseField<keyof EditPreProductionFormValues>[] = [
        { name: 'factory_name', label: 'Factory', disabled: true, optional: true },
        { name: 'ref_no', label: 'Order Ref', disabled: true, optional: true },
        { name: 'style', label: 'Style', disabled: true, optional: true },
        { name: 'meeting_date', label: 'Meeting Date', type: 'date', optional: true },
        { name: 'first_shipment_date', label: 'First Shipment Date', type: 'date', disabled: true, optional: true },
        { name: 'item', label: 'Item', disabled: true, optional: true },
        { name: 'fabric_description', label: 'Fabric Description', disabled: true, optional: true },
        { name: 'required_gsm', label: 'Fabric Required GSM', disabled: true, optional: true },
        { name: 'order_quantity', label: 'Order Quantity', type: 'number', disabled: true, optional: true },
        { name: 'size_range', label: 'Size Range', disabled: true, optional: true },
        { name: 'color_names', label: 'Color', disabled: true, optional: true },
        { name: 'daily_production_plan', label: 'Daily Production Plan (pcs)', type: 'number' },
    ];

    return { methods, formFields };
};
