import { Outlet } from "react-router-dom";

import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";

function DashboardLayout() {
  return (
    <>
      <Navbar />

      <div
        style={{
          display: "flex",
          minHeight: "calc(100vh - 60px)",
        }}
      >
        <Sidebar />

        <main
          style={{
            flex: 1,
            padding: "30px",
          }}
        >
          <Outlet />
        </main>
      </div>
    </>
  );
}

export default DashboardLayout;
