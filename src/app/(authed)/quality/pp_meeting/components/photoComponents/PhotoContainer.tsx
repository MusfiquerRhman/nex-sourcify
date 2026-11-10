"use client";

import type { PPMeetingImage } from "~/utils/images/ppMeetingImages";
import PhotoSection from "./PhotoSection";

type Props = {
    meetingId: string;
    ppsImages: PPMeetingImage[];
    sizeSetImages: PPMeetingImage[];
    disabled?: boolean;
};

const PhotoContainer = (props: Props) => {
    const { meetingId, ppsImages, sizeSetImages, disabled = false } = props;

    return (
        <div className="m-8 rounded-md border border-dashed border-gray-400 p-4 shadow-md" id="photo">
            <h3 className="mb-4 text-2xl font-semibold text-gray-800">{disabled ? 'PP Meeting Images' : 'Upload PP Meeting Images'}</h3>

            <PhotoSection meetingId={meetingId} section="pps_views" title="PPS view Front/back" images={ppsImages} disabled={disabled} />
            <PhotoSection meetingId={meetingId} section="size_set_views" title="Size Set view Front/back" images={sizeSetImages} disabled={disabled} />
        </div>
    );
};

export default PhotoContainer;
