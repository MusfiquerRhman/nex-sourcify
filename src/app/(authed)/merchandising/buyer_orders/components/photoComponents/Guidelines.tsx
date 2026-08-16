import React from "react";

const Guidelines = () => {
    return (
        <div className="mt-6 rounded-xl border border-dashed border-gray-400 bg-gray-50 p-5">
            <h3 className="mb-3 text-lg font-semibold text-gray-800">
                ⁉️ Image Upload Guidelines
            </h3>

            <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-700">
                <li>
                    Supported formats:{" "}
                    <span className="font-medium text-gray-900">
                    JPG, JPEG, PNG, WebP, HEIC, HEIF
                    </span>
                    .
                </li>
                <li>
                    Images are automatically compressed to stay under{" "}
                    <span className="font-medium text-gray-900">250 KB</span>.
                </li>
                <li>
                    <span className="font-medium text-gray-900">HEIC, HEIF (iPhone/iPad photos)</span>{" "}
                    are not supported in most browsers. They will be converted to{" "}
                    <span className="font-medium text-gray-900">JPG.</span>
                </li>
                <li className="text-amber-600">
                    Converting and Compressing will result in some quality loss.
                </li>
                <li className="text-amber-600">
                    Converting HEIC/HEIF to JPG and Compressing large files will take longer to process.
                </li>
            </ol>
        </div>
    )
};

export default React.memo(Guidelines);