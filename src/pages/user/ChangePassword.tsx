
import React from 'react';
import ChangePasswordForm from '../../components/ChangePasswordForm';

const ChangePassword: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-8 text-center">Account Security</h1>
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
