import SideBarWrapper from "~/components/templates/SidebarWrapper";
import ProtectedRoute from "~/components/templates/ProtectedRoutes";
import TopBar from "~/components/organisms/topBar";
import ScrollToTopBottom from "~/components/organisms/ScrollToTopBottom";

const Layout = ({ children }: { children: React.ReactNode }) => {

	return (
		<ProtectedRoute>
			<TopBar />
			<SideBarWrapper>
				{children}
				<ScrollToTopBottom />
			</SideBarWrapper>
		</ProtectedRoute>
	);
};

export default Layout;
