// Redirect to the new admin login page
import { Navigate } from "react-router-dom";

const AdminLogin = () => {
  return <Navigate to="/admin/login" replace />;
};

export default AdminLogin;
