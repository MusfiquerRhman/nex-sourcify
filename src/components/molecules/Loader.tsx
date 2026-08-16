
// Loader component with spinner and text
const Loader = () => {
    return (
        <div className="flex flex-col gap-4 w-full max-h-60 justify-center items-center py-10">
            <div className="loader"/>
            <div className="loader-text"/>
        </div>
    )
}

export default Loader;