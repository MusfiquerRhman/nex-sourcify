import { Path, Rect, Svg, Text, View } from "@react-pdf/renderer";
import { ppMeetingRiskAssessment, type PPMeetingRiskAssessmentSection } from "~/data/ppMeetingRiskAssessment";
import { formatPDFDate, pdfStyles, wrapPDFText } from "../pdfStyles";
import type { PPMeetingPDFData } from "../types";

type Props = {
    data: PPMeetingPDFData;
};

type ProductionPlan = PPMeetingPDFData['productionPlans'][number];

const productionColumns: { key: keyof ProductionPlan; label: string; width: number }[] = [
    { key: 'color_name', label: 'Colour', width: 15 },
    { key: 'po_no', label: 'PO No.', width: 16 },
    { key: 'size', label: 'Size', width: 8 },
    { key: 'order_quantity', label: 'Order Qty', width: 10 },
    { key: 'cutting_date', label: 'Cutting', width: 12 },
    { key: 'sewing_date', label: 'Sewing', width: 12 },
    { key: 'finishing_date', label: 'Finishing', width: 12 },
    { key: 'plan_inspection_date', label: 'Plan Inspection Date', width: 15 },
];

const planValue = (plan: ProductionPlan, key: keyof ProductionPlan) => {
    const value = plan[key];
    if (value instanceof Date) return formatPDFDate(value);
    if (typeof value === 'number') return value.toLocaleString('en-US');
    return wrapPDFText(value === '' ? '-' : value ?? '-', key === 'size' ? 6 : 10);
};

export const ProductionPlanTable = (props: Props) => {
    const { data } = props;
    const firstPlan = data.productionPlans[0];

    return (
        <View>
            <View wrap={false}>
                <Text style={pdfStyles.sectionTitle}>Production Plan</Text>
                <View style={pdfStyles.table}>
                    <View style={pdfStyles.headerRow}>
                        {productionColumns.map((column) => (
                            <Text key={column.key} style={[pdfStyles.headerCell, { width: `${column.width}%` }]}>{column.label}</Text>
                        ))}
                    </View>
                    {firstPlan && (
                        <View style={pdfStyles.row}>
                            {productionColumns.map((column) => (
                                <Text key={column.key} style={[pdfStyles.cell, { width: `${column.width}%` }]}>{planValue(firstPlan, column.key)}</Text>
                            ))}
                        </View>
                    )}
                    {!data.productionPlans.length && <Text style={[pdfStyles.emptyText, pdfStyles.emptyTableRow]}>No production plans available.</Text>}
                </View>
            </View>
            {data.productionPlans.slice(1).map((plan) => (
                <View key={plan.id} style={[pdfStyles.row, { borderLeftWidth: 0.75 }]} wrap={false}>
                    {productionColumns.map((column) => (
                        <Text key={column.key} style={[pdfStyles.cell, { width: `${column.width}%` }]}>{planValue(plan, column.key)}</Text>
                    ))}
                </View>
            ))}
        </View>
    );
};

type ApprovalColumnProps = {
    approvals: PPMeetingPDFData['approvalStatus'];
};

const approvalChoices = [{ label: 'Yes', value: 1 }, { label: 'No', value: 0 }, { label: 'N/A', value: -1 }];

const ApprovalColumn = (props: ApprovalColumnProps) => {
    const { approvals } = props;

    return (
        <View style={[pdfStyles.table, pdfStyles.approvalColumn]}>
            <View style={pdfStyles.headerRow}>
                <Text style={[pdfStyles.headerCell, pdfStyles.approvalName]}>Approval Status</Text>
                {approvalChoices.map((choice) => <Text key={choice.label} style={[pdfStyles.headerCell, { width: '9%', paddingHorizontal: 1 }]}>{choice.label}</Text>)}
            </View>
            {approvals.map((approval) => (
                <View key={approval.id} style={pdfStyles.row} wrap={false}>
                    <Text style={[pdfStyles.cell, pdfStyles.approvalName]}>{approval.status_name}</Text>
                    {approvalChoices.map((choice) => (
                        <View key={choice.label} style={[pdfStyles.cell, pdfStyles.approvalChoice, { paddingHorizontal: 1 }]}>
                            <Svg width={9} height={9} viewBox="0 0 12 12">
                                <Rect x={1} y={1} width={10} height={10} stroke="#6F6F6F" strokeWidth={0.75} fill="none" />
                                {(approval.approval_status ?? -1) === choice.value && <Path d="M 2.5 6 L 5 8.5 L 9.5 3" stroke="#000000" strokeWidth={1.2} fill="none" />}
                            </Svg>
                        </View>
                    ))}
                </View>
            ))}
        </View>
    );
};

export const ApprovalStatusTable = (props: Props) => {
    const { data } = props;
    const splitAt = Math.floor(data.approvalStatus.length / 2);

    return (
        <View wrap={false}>
            <Text style={pdfStyles.sectionTitle}>Approval Status</Text>
            {data.approvalStatus.length ? (
                <View style={pdfStyles.approvalColumns}>
                    <ApprovalColumn approvals={data.approvalStatus.slice(0, splitAt)} />
                    <ApprovalColumn approvals={data.approvalStatus.slice(splitAt)} />
                </View>
            ) : <Text style={pdfStyles.emptyText}>No approval statuses available.</Text>}
        </View>
    );
};

const renderComment = (comment: string) => {
    return comment.split(/(\*\*.*?\*\*)/g).map((part, index) => part.startsWith('**') && part.endsWith('**')
        ? <Text key={index} style={{ fontWeight: 700 }}>{part.slice(2, -2)}</Text>
        : part);
};

type RiskAssessmentRowProps = {
    item: PPMeetingRiskAssessmentSection;
};

const RiskAssessmentRow = (props: RiskAssessmentRowProps) => {
    const { item } = props;

    return (
        <View style={[pdfStyles.row, { borderLeftWidth: 0.75 }]} wrap={false}>
            <Text style={[pdfStyles.cell, pdfStyles.riskCell, { width: '20%', fontWeight: 700 }]}>{item.section}</Text>
            <View style={[pdfStyles.cell, pdfStyles.riskCell, { width: '40%' }]}>
                {item.comments.map((comment) => <Text key={comment} style={pdfStyles.paragraph}>{renderComment(comment)}</Text>)}
            </View>
            <View style={[pdfStyles.cell, pdfStyles.riskCell, { width: '40%' }]}>
                {item.actionPlan.map((action) => <Text key={action} style={pdfStyles.paragraph}>{renderComment(action)}</Text>)}
            </View>
        </View>
    );
};

export const RiskAssessmentTable = () => {
    const firstSection = ppMeetingRiskAssessment[0];

    return (
        <View wrap={false}>
            <View>
                <Text style={pdfStyles.sectionTitle}>Product Risk Assessment / Section wise Comments</Text>
                <View style={[pdfStyles.headerRow, { borderTopWidth: 0.75, borderLeftWidth: 0.75 }]}>
                    <Text style={[pdfStyles.headerCell, { width: '20%' }]}>Section</Text>
                    <Text style={[pdfStyles.headerCell, { width: '40%' }]}>Comments</Text>
                    <Text style={[pdfStyles.headerCell, { width: '40%' }]}>Action Plan</Text>
                </View>
                {firstSection && <RiskAssessmentRow item={firstSection} />}
            </View>
            {ppMeetingRiskAssessment.slice(1).map((item) => <RiskAssessmentRow key={item.section} item={item} />)}
        </View>
    );
};
