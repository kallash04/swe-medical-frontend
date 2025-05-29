
import React, { useState, useEffect } from 'react';
import { User, UserCheck, Mail } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UnassignedUser {
  id: string;
  name: string;
  email: string;
  role: 'user';
  profile_photo_url?: string;
  assigned_doctor_id?: string;
  created_at: string;
  updated_at: string;
}

interface Doctor {
  id: string;
  name: string;
  email: string;
  role: 'doctor';
  department_id?: string;
}

const Unassigned: React.FC = () => {
  const [unassignedUsers, setUnassignedUsers] = useState<UnassignedUser[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);

  useEffect(() => {
    fetchUnassignedUsers();
    fetchDoctors();
  }, []);

  const fetchUnassignedUsers = async () => {
    try {
      const data = await adminAPI.getUnassignedUsers();
      setUnassignedUsers(data);
    } catch (error) {
      console.error('Error fetching unassigned users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const data = await adminAPI.getDoctors();
      setDoctors(data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const handleAssignDoctor = async (userId: string, doctorId: string) => {
    setAssigning(userId);
    try {
      await adminAPI.assignDoctor(userId, doctorId);
      setUnassignedUsers(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error assigning doctor:', error);
    } finally {
      setAssigning(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Unassigned Users</h1>

        <Card>
          <CardHeader>
            <CardTitle>Users Without Assigned Doctor</CardTitle>
          </CardHeader>
          <CardContent>
            {unassignedUsers.length === 0 ? (
              <div className="text-center py-8">
                <UserCheck className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-500">All users have been assigned to doctors!</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Assign Doctor</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unassignedUsers.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center">
                          {user.profile_photo_url ? (
                            <img
                              src={user.profile_photo_url}
                              alt={user.name}
                              className="w-8 h-8 rounded-full object-cover mr-3"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                          )}
                          {user.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell>
                        <Select 
                          onValueChange={(doctorId) => handleAssignDoctor(user.id, doctorId)}
                          disabled={assigning === user.id}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select doctor" />
                          </SelectTrigger>
                          <SelectContent>
                            {doctors.map(doctor => (
                              <SelectItem key={doctor.id} value={doctor.id}>
                                {doctor.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {assigning === user.id && (
                          <div className="flex items-center text-blue-600">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                            Assigning...
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Unassigned;
