import { Document, Page, Text, View } from "@react-pdf/renderer";
import { useDecodedUser } from "~/hooks";
import type { HeaderData } from "~/types/pdf";
import { sampleChecklistStatusOptions } from "~/utils/sampleChecklist";
import { HeaderPart, PrintByAndDate, NexSourcifyLogo, ReportTitle } from "../components";
import { registerPdfFonts, styles } from "../components/pdfConfig";
import { formatPDFDate, wrapPDFText } from "../pp_meeting/pdfStyles";
import ChecklistSections from "./components/ChecklistSections";
import { checklistStyles } from "./pdfStyles";
import type { SampleChecklistPDFData, SampleChecklistPDFImages } from "./types";

type SampleChecklistPDFProps = { data: SampleChecklistPDFData; images: SampleChecklistPDFImages };

registerPdfFonts();

const SampleChecklistPDF = (props: SampleChecklistPDFProps) => {
    const { data, images } = props;
    const { user } = useDecodedUser();
    const orderRef = data.with_order ? (data.order_styles?.buyer_orders.ref_no ?? "-") : "-";
    const style = data.with_order ? (data.order_styles?.style ?? "-") : (data.style_no_manual ?? "-");

    const headerData: HeaderData = [
        [
            { label: "Reference No", value: data.sample_ref_no || "-" },
            { label: "Buyer", value: data.buyers.buyer_name },
            { label: "Factory", value: data.factories.name },
            { label: "Order Ref", value: orderRef },
            { label: "Style", value: style },
            { label: "Color", value: data.colors.name },
            { label: "Sample Size", value: (data.sample_size ?? "").trim() || "-" },
        ],
        [
            { label: "Submission No", value: String(data.submission_no ?? 1) },
            { label: "Sample Type", value: data.sample_types.name },
            { label: "Date", value: formatPDFDate(data.sample_check_date) },
            { label: "With Order", value: data.with_order ? "Yes" : "No" },
            { label: "Sample Quantity", value: data.sample_quantity?.toLocaleString("en-US") ?? "-" },
            { label: "Status", value: sampleChecklistStatusOptions.find((option) => option.value === data.status)?.label ?? "-" },
            { label: "Checked By", value: data.users?.user_id ?? "-" },
        ],
    ].map((column) => column.map((field) => ({ ...field, value: wrapPDFText(String(field.value), 28) })));

    return (
        <Document
            title={data.with_order ? `Sample Checklist - ${orderRef} - ${style}` : `Sample Checklist - ${style}`}
            author="Nex-Sourcify"
            subject="Sample Checklist Report"
            keywords="Sample Checklist, Quality, PDF, Nex-Sourcify, ERP"
            creator={user ? `${user.first_name} ${user.last_name}` : "Nex-Sourcify"}
            producer="Nex-Sourcify"
            pageMode="useOutlines"
            creationDate={new Date()}
        >
            <Page orientation="portrait" size="A4" style={styles.body} wrap>
                <View style={checklistStyles.nonShrinkingBlock} fixed>
                    <NexSourcifyLogo />
                </View>
                <View style={checklistStyles.nonShrinkingBlock} wrap={false}>
                    <PrintByAndDate />
                    <ReportTitle title="SAMPLE CHECKLIST" />
                    <HeaderPart data={headerData} variant="between" />
                </View>

                <ChecklistSections data={data} images={images} />
                <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
            </Page>
        </Document>
    );
};

export default SampleChecklistPDF;
