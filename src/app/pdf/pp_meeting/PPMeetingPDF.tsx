import { Document, Page, Text } from "@react-pdf/renderer";
import { HeaderPart, PrintByAndDate, NexSourcifyLogo, ReportTitle } from "../components";
import { registerPdfFonts, styles } from "../components/pdfConfig";
import { useDecodedUser } from "~/hooks";
import { AttendancePhoto, MeetingImages } from "./components/MeetingImages";
import { ApprovalStatusTable, ProductionPlanTable, RiskAssessmentTable } from "./components/MeetingTables";
import { formatPDFDate, pdfStyles, wrapPDFText } from "./pdfStyles";
import type { PPMeetingPDFData } from "./types";
import type { HeaderData } from "~/types/pdf";

type Props = {
    data: PPMeetingPDFData;
};

registerPdfFonts();

const PPMeetingPDF = (props: Props) => {
    const { data } = props;
    const { user } = useDecodedUser();

    const meetingHeaderData: HeaderData = [
        [
            { label: 'Factory', value: data.factory_name },
            { label: 'Order Ref', value: data.ref_no },
            { label: 'Style No.', value: data.style },
            { label: 'Fabric Description', value: data.fabric_description },
            { label: 'Order Quantity', value: data.order_quantity.toLocaleString('en-US') },
            { label: 'Color', value: data.color_names },
        ],
        [
            { label: 'Meeting Date', value: formatPDFDate(data.meeting_date) },
            { label: 'First Shipment Date', value: formatPDFDate(data.first_shipment_date) },
            { label: 'Item', value: data.item },
            { label: 'Fabric Required GSM', value: data.required_gsm },
            { label: 'Size Range', value: data.size_range },
            { label: 'Daily Production Plan', value: data.daily_production_plan?.toLocaleString('en-US') ?? '-' },
        ],
    ];

    return (
        <Document
            title={`Pre Production Meeting - ${data.ref_no} - ${data.style}`}
            author="Nex-Sourcify"
            subject="Pre Production Meeting Report"
            keywords="Pre Production, Meeting, Quality, PDF, Nex-Sourcify, ERP"
            creator={user ? `${user.first_name} ${user.last_name}` : 'Nex-Sourcify'}
            producer="Nex-Sourcify"
            pageMode="useOutlines"
            creationDate={new Date()}
        >
            <Page orientation="portrait" size="A4" style={styles.body} wrap>
                <NexSourcifyLogo />
                <PrintByAndDate />
                <ReportTitle title="PRE PRODUCTION MEETING"/>

                <HeaderPart data={meetingHeaderData} variant="between"/>
                <ProductionPlanTable data={data} />
                <ApprovalStatusTable data={data} />
                <MeetingImages data={data} />

                <Text style={pdfStyles.sectionTitle} minPresenceAhead={40}>Overall Comments</Text>
                <Text style={pdfStyles.comment} orphans={2} widows={2}>{wrapPDFText(data.overall_comments === '' ? '-' : data.overall_comments ?? '-', 60)}</Text>

                <RiskAssessmentTable />
                <AttendancePhoto data={data} />

                <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
            </Page>
        </Document>
    );
};

export default PPMeetingPDF;
