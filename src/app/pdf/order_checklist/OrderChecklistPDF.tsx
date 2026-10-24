import { Document, Page, Text } from "@react-pdf/renderer";
import { registerPdfFonts, styles } from "../components/pdfConfig";
import { PrintByAndDate, RenaissanceLogo, ReportTitle, HeaderPart, Signature } from "../components";
import ChecklistTable from "./components/ChecklistTable";
import { useDecodedUser } from "~/hooks";
import type { HeaderData } from "~/types/pdf";
import type { GetOrderChecklistPDFDataTypes } from "~/types/qualityAPITypes";

type Props = {
    data: GetOrderChecklistPDFDataTypes;
};

registerPdfFonts();

const OrderChecklistPDF = (props: Props) => {
    const { data } = props;
    const { user } = useDecodedUser();

    const header = data.header[0];
    const checklistHeader: HeaderData = [
        [
            { label: "Buyer Name", value: header?.buyer_name ?? '' },
            { label: "NexSourcify Order No", value: header?.ref_no ?? '' },
            { label: "Style", value: header?.style ?? '' },
        ],
        [
            { label: "PO", value: header?.po ?? '' },
            { label: "Factory Name", value: header?.factory_name ?? '' },
        ],
    ];

    return (
        <Document
            title={`Order Checklist - ${header?.ref_no ?? ''}`}
            author="NexSourcify Nexus"
            subject="Order Checklist PDF"
            keywords="Order, Checklist, Quality, PDF, NexSourcify Nexus, ERP"
            creator={user ? `${user.first_name} ${user.last_name}` : "NexSourcify Nexus"}
            producer="NexSourcify Nexus"
            pageMode="useOutlines"
            creationDate={new Date()}
        >
            <Page orientation="landscape" size="A4" style={styles.body} wrap>
                <RenaissanceLogo />
                <PrintByAndDate />
                <ReportTitle title="ORDER CHECKLIST" />
                <HeaderPart data={checklistHeader} />
                <ChecklistTable details={data.details} />
                <Signature signatures={["Technical Check by", "QA Check By"]} />
                <Text
                    style={styles.pageNumber}
                    render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
                    fixed
                />
            </Page>
        </Document>
    );
};

export default OrderChecklistPDF;
