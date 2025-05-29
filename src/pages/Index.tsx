
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Index = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user) {
    // Redirect based on user role
    switch (user.role) {
      case 'user':
        return <Navigate to="/doctors" replace />;
      case 'doctor':
        return <Navigate to="/patients" replace />;
      case 'admin':
        return <Navigate to="/admin/users" replace />;
      default:
        return <Navigate to="/doctors" replace />;
    }
  }

  return <Navigate to="/" replace />;
};

export default Index;
