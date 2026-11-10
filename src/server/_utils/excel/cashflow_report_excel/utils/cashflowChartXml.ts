import type ExcelJS from "exceljs";
import { TABLE_HEADER_ROW } from "../../config";

export const CHART_NAMESPACE = "http://schemas.openxmlformats.org/drawingml/2006/chart";
const DRAWING_NAMESPACE = "http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing";
const CHART_DRAWING_NAMESPACE = "http://schemas.openxmlformats.org/drawingml/2006/chartDrawing";
const DRAWINGML_MAIN_NAMESPACE = "http://schemas.openxmlformats.org/drawingml/2006/main";
export const RELATIONSHIP_NAMESPACE = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
export const XML_HEADER = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

const MONTHLY_WEEKLY_PLOT = { x: 0.02, y: 0.14, width: 0.96, height: 0.56 };
const MONTH_LABEL_TOP = 0.84;
const MONTH_LABEL_BOTTOM = 0.98;

const getMonthBoundaries = (worksheet: ExcelJS.Worksheet) => {
    const boundaries: number[] = [];
    for (let row = TABLE_HEADER_ROW + 2; row < worksheet.rowCount; row++) {
        if (worksheet.getCell(row, 1).text) boundaries.push(row - TABLE_HEADER_ROW - 1);
    }
    return boundaries;
};

export type ChartDefinition = {
    sheet: string;
    title: string;
    valueColumn: string;
    grouped: boolean;
    millions: boolean;
};

const escapeXml = (value: string | number) => String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const chartPoints = (values: (string | number)[]) => values.map((value, index) => /*xml*/`
    <c:pt idx="${index}">
        <c:v>${escapeXml(value)}</c:v>
    </c:pt>
`).join("");

const chartText = (size: number, rotation = 0) => /*xml*/`
    <c:txPr>
        <a:bodyPr rot="${rotation}"/>
        <a:lstStyle/>
        <a:p>
            <a:pPr>
                <a:defRPr sz="${size}"/>
            </a:pPr>
            <a:endParaRPr lang="en-US"/>
        </a:p>
    </c:txPr>
`;

export const createChartXml = (worksheet: ExcelJS.Worksheet, definition: ChartDefinition) => {
    const firstRow = TABLE_HEADER_ROW + 1;
    const lastRow = worksheet.rowCount - 1;
    const categories: string[] = [];
    const values: number[] = [];

    for (let row = firstRow; row <= lastRow; row++) {
        categories.push(worksheet.getCell(row, definition.grouped ? 2 : 1).text);

        const cell = worksheet.getCell(`${definition.valueColumn}${row}`);
        values.push(Number(cell.result ?? cell.value ?? 0));
    }

    const count = values.length;
    const sheetName = `'${worksheet.name.replace(/'/g, "''")}'`;
    // An empty cache keeps empty reports blank without pointing at the Grand Total row.
    const categoryCache = /*xml*/`
            <c:strCache>
                <c:ptCount val="${count}"/>
                ${chartPoints(categories)}
            </c:strCache>
        `;
    const categoryReference = "strRef";
    const categoryColumn = definition.grouped ? "B" : "A";
    const categoryFormula = count
        ? /*xml*/`<c:f>${escapeXml(`${sheetName}!$${categoryColumn}$${firstRow}:$${categoryColumn}$${lastRow}`)}</c:f>`
        : "";
    const categoryXml = count
        ? /*xml*/`
            <c:${categoryReference}>
                ${categoryFormula}
                ${categoryCache}
            </c:${categoryReference}>
        `
        : /*xml*/`
            <c:strLit>
                <c:ptCount val="0"/>
            </c:strLit>
        `;
    const numberFormat = definition.millions ? '0.00,," M"' : '"$"#,##0';
    const numberCache = /*xml*/`
        <c:formatCode>${escapeXml(numberFormat)}</c:formatCode>
        <c:ptCount val="${count}"/>
        ${chartPoints(values)}
    `;
    const valueXml = count
        ? /*xml*/`
            <c:numRef>
                <c:f>${escapeXml(`${sheetName}!$${definition.valueColumn}$${firstRow}:$${definition.valueColumn}$${lastRow}`)}</c:f>
                <c:numCache>${numberCache}</c:numCache>
            </c:numRef>
        `
        : /*xml*/`
            <c:numLit>${numberCache}</c:numLit>
        `;

    const rotation = -5400000;
    const minimum = values.some((value) => value < 0) ? "" : /*xml*/`
        <c:min val="0"/>
    `;

    const plotLayout = definition.grouped ? /*xml*/`
        <c:layout>
            <c:manualLayout>
                <c:layoutTarget val="inner"/>
                <c:xMode val="edge"/>
                <c:yMode val="edge"/>
                <c:wMode val="factor"/>
                <c:hMode val="factor"/>
                <c:x val="${MONTHLY_WEEKLY_PLOT.x}"/>
                <c:y val="${MONTHLY_WEEKLY_PLOT.y}"/>
                <c:w val="${MONTHLY_WEEKLY_PLOT.width}"/>
                <c:h val="${MONTHLY_WEEKLY_PLOT.height}"/>
            </c:manualLayout>
        </c:layout>
    ` : /*xml*/`<c:layout/>`;

    const monthAxis = definition.grouped && count > 0
        ? /*xml*/`<c:userShapes xmlns:r="${RELATIONSHIP_NAMESPACE}" r:id="rIdMonthAxis"/>`
        : "";

    return /*xml*/`${XML_HEADER}
    <c:chartSpace xmlns:c="${CHART_NAMESPACE}" xmlns:a="${DRAWINGML_MAIN_NAMESPACE}">
        <c:date1904 val="0"/>
        <c:lang val="en-US"/>
        <c:style val="2"/>
        <c:chart>
            <c:title>
                <c:tx>
                    <c:rich>
                        <a:bodyPr/>
                        <a:lstStyle/>
                        <a:p>
                            <a:pPr>
                                <a:defRPr sz="1400"/>
                            </a:pPr>
                            <a:r>
                                <a:t>${escapeXml(definition.title)}</a:t>
                            </a:r>
                        </a:p>
                    </c:rich>
                </c:tx>
                <c:overlay val="0"/>
            </c:title>
            <c:autoTitleDeleted val="0"/>
            <c:plotArea>
                ${plotLayout}
                <c:barChart>
                    <c:barDir val="col"/>
                    <c:grouping val="clustered"/>
                    <c:varyColors val="0"/>
                    <c:ser>
                        <c:idx val="0"/>
                        <c:order val="0"/>
                        <c:tx>
                            <c:v>Total</c:v>
                        </c:tx>
                        <c:spPr>
                            <a:solidFill>
                                <a:srgbClr val="4472C4"/>
                            </a:solidFill>
                            <a:ln>
                                <a:noFill/>
                            </a:ln>
                        </c:spPr>
                        <c:invertIfNegative val="0"/>
                        <c:cat>${categoryXml}</c:cat>
                        <c:val>${valueXml}</c:val>
                    </c:ser>
                    <c:dLbls>
                        <c:numFmt formatCode="${escapeXml(numberFormat)}" sourceLinked="0"/>
                        ${chartText(800, rotation)}
                        <c:dLblPos val="outEnd"/>
                        <c:showLegendKey val="0"/>
                        <c:showVal val="1"/>
                        <c:showCatName val="0"/>
                        <c:showSerName val="0"/>
                        <c:showPercent val="0"/>
                        <c:showBubbleSize val="0"/>
                    </c:dLbls>
                    <c:gapWidth val="40"/>
                    <c:overlap val="-27"/>
                    <c:axId val="100"/>
                    <c:axId val="200"/>
                </c:barChart>
                <c:catAx>
                    <c:axId val="100"/>
                    <c:scaling>
                        <c:orientation val="minMax"/>
                    </c:scaling>
                    <c:delete val="0"/>
                    <c:axPos val="b"/>
                    <c:majorTickMark val="none"/>
                    <c:minorTickMark val="none"/>
                    <c:tickLblPos val="nextTo"/>
                    ${chartText(800, rotation)}
                    <c:crossAx val="200"/>
                    <c:crosses val="autoZero"/>
                    <c:auto val="1"/>
                    <c:lblAlgn val="ctr"/>
                    <c:lblOffset val="100"/>
                    <c:noMultiLvlLbl val="0"/>
                </c:catAx>
                <c:valAx>
                    <c:axId val="200"/>
                    <c:scaling>
                        <c:orientation val="minMax"/>
                        ${minimum}
                    </c:scaling>
                    <c:delete val="${definition.millions ? 0 : 1}"/>
                    <c:axPos val="l"/>
                    <c:numFmt formatCode="${escapeXml(numberFormat)}" sourceLinked="0"/>
                    <c:majorTickMark val="none"/>
                    <c:minorTickMark val="none"/>
                    <c:tickLblPos val="nextTo"/>
                    ${chartText(900)}
                    <c:crossAx val="100"/>
                    <c:crosses val="autoZero"/>
                    <c:crossBetween val="between"/>
                </c:valAx>
            </c:plotArea>
            <c:plotVisOnly val="1"/>
            <c:dispBlanksAs val="gap"/>
            <c:showDLblsOverMax val="0"/>
        </c:chart>
        <c:spPr>
            <a:solidFill>
                <a:srgbClr val="FFFFFF"/>
            </a:solidFill>
            <a:ln>
                <a:solidFill>
                    <a:srgbClr val="D9D9D9"/>
                </a:solidFill>
            </a:ln>
        </c:spPr>
        ${monthAxis}
    </c:chartSpace>`;
};

export const createMonthAxisXml = (worksheet: ExcelJS.Worksheet) => {
    const count = worksheet.rowCount - TABLE_HEADER_ROW - 1;
    if (count <= 0) return null;

    const boundaries = [0, ...getMonthBoundaries(worksheet), count];
    const axisBottom = MONTHLY_WEEKLY_PLOT.y + MONTHLY_WEEKLY_PLOT.height;

    const dividers = boundaries.map((boundary, index) => {
        const x = MONTHLY_WEEKLY_PLOT.x + MONTHLY_WEEKLY_PLOT.width * boundary / count;

        return /*xml*/`
            <cdr:relSizeAnchor>
                <cdr:from>
                    <cdr:x>${x}</cdr:x>
                    <cdr:y>${axisBottom}</cdr:y>
                </cdr:from>
                <cdr:to>
                    <cdr:x>${x}</cdr:x>
                    <cdr:y>${MONTH_LABEL_BOTTOM}</cdr:y>
                </cdr:to>
                <cdr:sp macro="">
                    <cdr:nvSpPr><cdr:cNvPr id="${index + 1}" name="Month separator ${index + 1}"/><cdr:cNvSpPr/></cdr:nvSpPr>
                    <cdr:spPr>
                        <a:prstGeom prst="line"><a:avLst/></a:prstGeom>
                        <a:ln w="9525"><a:solidFill><a:srgbClr val="D9D9D9"/></a:solidFill><a:prstDash val="solid"/></a:ln>
                    </cdr:spPr>
                </cdr:sp>
            </cdr:relSizeAnchor>
        `;
    }).join("");

    const labels = boundaries.slice(0, -1).map((start, index) => {
        const end = boundaries[index + 1]!;
        const left = MONTHLY_WEEKLY_PLOT.x + MONTHLY_WEEKLY_PLOT.width * start / count;
        const right = MONTHLY_WEEKLY_PLOT.x + MONTHLY_WEEKLY_PLOT.width * end / count;
        const month = worksheet.getCell(TABLE_HEADER_ROW + 1 + start, 1).text;

        return /*xml*/`
            <cdr:relSizeAnchor>
                <cdr:from>
                    <cdr:x>${left}</cdr:x>
                    <cdr:y>${MONTH_LABEL_TOP}</cdr:y>
                </cdr:from>
                <cdr:to>
                    <cdr:x>${right}</cdr:x>
                    <cdr:y>${MONTH_LABEL_BOTTOM}</cdr:y>
                </cdr:to>
                <cdr:sp macro="">
                    <cdr:nvSpPr>
                        <cdr:cNvPr id="${boundaries.length + index + 1}" name="Month label ${escapeXml(month)}"/>
                        <cdr:cNvSpPr txBox="1"/>
                    </cdr:nvSpPr>
                    <cdr:spPr>
                        <a:prstGeom prst="rect">
                            <a:avLst/>
                        </a:prstGeom>
                        <a:noFill/>
                            <a:ln>
                                <a:noFill/>
                            </a:ln>
                        </cdr:spPr>
                    <cdr:txBody>
                        <a:bodyPr vert="vert270" wrap="none" anchor="ctr" anchorCtr="1" lIns="0" tIns="0" rIns="0" bIns="0"/>
                        <a:lstStyle/>
                        <a:p>
                            <a:pPr algn="ctr">
                                <a:defRPr sz="800">
                                    <a:solidFill>
                                        <a:srgbClr val="404040"/>
                                    </a:solidFill>
                                </a:defRPr>
                            </a:pPr>
                            <a:r>
                                <a:t>${escapeXml(month)}</a:t>
                            </a:r>
                        </a:p>
                    </cdr:txBody>
                </cdr:sp>
            </cdr:relSizeAnchor>
        `;
    }).join("");

    return /*xml*/`${XML_HEADER}
        <c:userShapes xmlns:c="${CHART_NAMESPACE}" 
            xmlns:cdr="${CHART_DRAWING_NAMESPACE}" 
            xmlns:a="${DRAWINGML_MAIN_NAMESPACE}"
        >
            ${dividers}
            ${labels}
        </c:userShapes>
    `;
};

export const createDrawingXml = (index: number, definition: ChartDefinition, pointCount: number) => {
    const width = Math.max(definition.grouped ? 720 : 420, pointCount * 30);
    const height = definition.grouped ? 500 : 420;

    return /*xml*/`${XML_HEADER}
    <xdr:wsDr xmlns:xdr="${DRAWING_NAMESPACE}" xmlns:a="${DRAWINGML_MAIN_NAMESPACE}">
        <xdr:oneCellAnchor>
            <xdr:from>
                <xdr:col>${definition.grouped ? 4 : 3}</xdr:col>
                <xdr:colOff>0</xdr:colOff>
                <xdr:row>${TABLE_HEADER_ROW - 1}</xdr:row>
                <xdr:rowOff>0</xdr:rowOff>
            </xdr:from>
            <xdr:ext cx="${width * 9525}" cy="${height * 9525}"/>
            <xdr:graphicFrame macro="">
                <xdr:nvGraphicFramePr>
                    <xdr:cNvPr id="${index + 1}" name="${escapeXml(definition.title)}"/>
                    <xdr:cNvGraphicFramePr/>
                </xdr:nvGraphicFramePr>
                <xdr:xfrm>
                    <a:off x="0" y="0"/>
                    <a:ext cx="0" cy="0"/>
                </xdr:xfrm>
                <a:graphic>
                    <a:graphicData uri="${CHART_NAMESPACE}">
                        <c:chart xmlns:c="${CHART_NAMESPACE}" xmlns:r="${RELATIONSHIP_NAMESPACE}" r:id="rId1"/>
                    </a:graphicData>
                </a:graphic>
            </xdr:graphicFrame>
            <xdr:clientData/>
        </xdr:oneCellAnchor>
    </xdr:wsDr>`;
};
