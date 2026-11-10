export type PPMeetingRiskAssessmentSection = {
    readonly section: string;
    readonly comments: readonly string[];
    readonly actionPlan: readonly string[];
};

// Shared by the PP meeting form and report. Source: PPM.xlsx, PPM!A37:L43.
export const ppMeetingRiskAssessment: readonly PPMeetingRiskAssessmentSection[] = [
    {
        section: 'QA Comment',
        comments: [
            '1. Ensure the front cut-and-sew grainline is straight and the leg hems are symmetrical.',
            '2. Ensure the bow shade is consistent within one shade, and the knot and bow width are maintained as per the approved specification.',
            '3. Ensure inseam forwarding is even on both sides.',
        ],
        actionPlan: [
            'Maintain approved GSM.',
            'Ensure even waist gathering.',
            'Control fabric shrinkage.',
            'Avoid uneven length, skipped/broken stitches, spots, and overlapping prints.',
        ],
    },
    {
        section: 'GT Comment  / Buyer comments',
        comments: [
            'Use approved elastic for the waistband.',
            'Ensure the elastic is not excessively tight.',
            'Ensure the elastic is pre-shrunk before production',
        ],
        actionPlan: [
            '1. Approved elastic will be used for the waistband.',
            '2. Elastic tension will be checked and maintained as per the approved standard.',
            '3. Only pre-shrunk elastic will be used, and QA will verify before bulk production.',
        ],
    },
    {
        section: 'Cutting Section',
        comments: [
            '1. Fabric cutting will start only after receiving an approved Nex-Sourcify Lab test report.',
            '2. Fabric lay height will be maintained at **2½ inches**.',
            '3. GSM will be verified as per the approved specification.',
            '4. Defective fabric will be segregated and will not be used for cutting.',
        ],
        actionPlan: [
            '1. Fabric will be sent to the Nex-Sourcify Lab, and cutting will begin only after receiving a passing test report.',
            '2. Fabric lay height will be maintained at a maximum of **2½ inches** during cutting.',
            '3. GSM will be verified against the approved specification before production.',
        ],
    },
    {
        section: 'Sewing Section',
        comments: [
            '1. Adjust sewing machine thread tension properly.',
            '2. Maintain the needle change calendar and needle control.',
            '3. Prevent skipped/broken stitches, uneven length, spots, and dust.',
            '4. Complete mock-up approval for critical processes.',
            '5. Maintain 12 SPI (Top Stitch) and 14 SPI (Overlock).',
        ],
        actionPlan: [
            '1. Maintain approved sewing parameters.',
            '2. Follow needle, label, and oil control procedures.',
            '3. Ensure required SPI and measurements.',
            '4. Prevent sewing defects through inline inspection.',
            '5. Trim loose threads and clean garments before the next process.',
        ],
    },
    {
        section: 'Finishing Section',
        comments: [
            '1. Packing will start only after Nex-Sourcify Merchant approval.',
            '2. A maximum of 4 blisters will be packed per carton.',
            '3. Sketch marks and proper handling procedures will be followed during packing.',
            '4. Garment shape and symmetry will be verified before packing.',
        ],
        actionPlan: [
            '1. Follow approved packing standards before shipment.',
            '2. Maintain the approved packing method and carton quantity.',
            '3. Ensure proper garment handling during packing.',
            '4. Verify garment shape and appearance before packing.',
        ],
    },
    {
        section: 'Packaging & Packing',
        comments: [
            '1. Packing will start only after packing approval and the LOF sheet will be followed.',
            '2. QR Code, TB, and MI stickers will be verified before packing.',
        ],
        actionPlan: [
            '1. Packing approval and the LOF sheet will be followed before packing starts.',
            '2. QR Code, TB, and MI stickers will be verified during packing.',
        ],
    },
    {
        section: 'Product Safety',
        comments: [
            '1. Ensure 100% garments pass the MD machine before shipment. Pull test m/b aceived .',
        ],
        actionPlan: [
            '1. 100% garments will be inspected and passed through the MD machine before shipment.',
        ],
    },
];
