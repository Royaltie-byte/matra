import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <aside
      style={{
        width: "220px",
        background: "#f5f5f5",
        padding: "20px",
      }}
    >
      <ul style={{ listStyle: "none", padding: 0 }}>
        <li><Link to="/dashboard">Dashboard</Link></li>
        <li><Link to="/patients">Patients</Link></li>
        <li><Link to="/appointments">Appointments</Link></li>
        <li><Link to="/profile">Profile</Link></li>
        <li><Link to="/settings">Settings</Link></li>
      </ul>
    </aside>
  );
}

export default Sidebar;
