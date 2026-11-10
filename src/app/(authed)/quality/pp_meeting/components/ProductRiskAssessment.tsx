import { Heading, TableBody, TableCell, TableHead, TableHeadCells, TableRow, TableWrapper } from "~/components";
import { ppMeetingRiskAssessment } from "~/data/ppMeetingRiskAssessment";

const ProductRiskAssessment = () => {
    return (
        <section className="px-8 pb-8">
            <Heading as="h2" className="mb-4">Product Risk Assessment / Sectionwise Comments</Heading>

            <TableWrapper>
                <TableHead>
                    <tr>
                        <TableHeadCells className="w-1/5">Section</TableHeadCells>
                        <TableHeadCells className="w-2/5">Comments</TableHeadCells>
                        <TableHeadCells className="w-2/5">Action Plan</TableHeadCells>
                    </tr>
                </TableHead>
                <TableBody>
                    {ppMeetingRiskAssessment.map((item) => (
                        <TableRow key={item.section}>
                            <TableCell className="align-top text-left font-semibold">{item.section}</TableCell>
                            <TableCell className="align-top text-left">
                                {item.comments.map((comment) => <p key={comment} className="mb-2 last:mb-0">{comment}</p>)}
                            </TableCell>
                            <TableCell className="align-top text-left">
                                {item.actionPlan.map((action) => <p key={action} className="mb-2 last:mb-0">{action}</p>)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </TableWrapper>
        </section>
    );
};

export default ProductRiskAssessment;
