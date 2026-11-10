"use client";

import PhotoSection from "./PhotoSection";

type Props = {
    meetingId: string;
    photo: string | null;
    disabled?: boolean;
};

const AttendancePhoto = (props: Props) => {
    const { meetingId, photo, disabled = false } = props;

    const imageId = photo?.split('/').pop()?.replace(/\.jpg$/i, '');
    const images = photo && imageId ? [{ id: imageId, url: photo }] : [];

    return (
        <div className="m-8 rounded-md border border-dashed border-gray-400 p-4 shadow-md" id="attendance-photo">
            <h3 className="mb-4 text-2xl font-semibold text-gray-800">Attendance List</h3>
            <PhotoSection meetingId={meetingId} section="attendance_lists" title="Attendance List Photo" images={images} disabled={disabled} />
        </div>
    );
};

export default AttendancePhoto;
