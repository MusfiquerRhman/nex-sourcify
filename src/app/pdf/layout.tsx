import ProtectedRoute from "~/components/templates/ProtectedRoutes";
const Layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <ProtectedRoute>
            {children}
        </ProtectedRoute>
    );
};

export default Layout;
