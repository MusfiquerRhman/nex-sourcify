import SideBarWrapper from "~/components/templates/SidebarWrapper";
import ProtectedRoute from "~/components/templates/ProtectedRoutes";
import TopBar from "~/components/organisms/topBar";

const Layout = ({ children }: { children: React.ReactNode }) => {

  return (
      <ProtectedRoute>
        <TopBar />
        <SideBarWrapper>
          {children}
        </SideBarWrapper>
      </ProtectedRoute>
  );
};

export default Layout;
