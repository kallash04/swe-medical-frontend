
import React, { useState, useEffect } from 'react';
import { X, User, Calendar, Clock, FileText, CheckCircle, XCircle } from 'lucide-react';
import { doctorAPI } from '../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Appointment {
  id: string;
  user_id: string;
  doctor_id: string;
  appointment_time: string;
  status: 'scheduled' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
  patient_name?: string;
}

interface Service {
  id: string;
  name: string;
  description?: string;
}

interface MedicalRecord {
  id: string;
  user_id: string;
  data: {
    bloodType?: string;
    allergies?: string[];
    medications?: string[];
    conditions?: string[];
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
    insurance?: {
      provider: string;
      policyNumber: string;
    };
  };
  last_edited_by?: string;
  created_at: string;
  last_edited_at: string;
}

interface AppointmentDetailsProps {
  appointment: Appointment;
  onClose: () => void;
  onUpdate: () => void;
}

const AppointmentDetails: React.FC<AppointmentDetailsProps> = ({ 
  appointment, 
  onClose, 
  onUpdate 
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchAppointmentData();
  }, [appointment.id]);

  const fetchAppointmentData = async () => {
    try {
      const [servicesData, recordData] = await Promise.all([
        doctorAPI.getAppointmentServices(appointment.id),
        doctorAPI.getPatientRecord(appointment.user_id)
      ]);
      
      setServices(servicesData);
      setMedicalRecord(recordData);
    } catch (error) {
      console.error('Error fetching appointment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setUpdating(true);
    try {
      await doctorAPI.cancelAppointment(appointment.id);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error canceling appointment:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleComplete = async () => {
    setUpdating(true);
    try {
      await doctorAPI.completeAppointment(appointment.id);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error completing appointment:', error);
    } finally {
      setUpdating(false);
    }
  };

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateTime: string) => {
    return new Date(dateTime).toLocaleDateString();
  };

  const canComplete = () => {
    const appointmentTime = new Date(appointment.appointment_time);
    const now = new Date();
    return appointmentTime <= now && appointment.status === 'scheduled';
  };

  const canCancel = () => {
    return appointment.status === 'scheduled';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Appointment Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Appointment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Appointment Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Patient</p>
                  <p className="font-medium">{appointment.user_name || 'Patient'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                    appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">{formatDate(appointment.appointment_time)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Time</p>
                  <p className="font-medium">{formatTime(appointment.appointment_time)}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                {canComplete() && (
                  <Button 
                    onClick={handleComplete} 
                    disabled={updating}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Appointment
                  </Button>
                )}
                {canCancel() && (
                  <Button 
                    variant="destructive" 
                    onClick={handleCancel} 
                    disabled={updating}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Appointment
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle>Selected Services</CardTitle>
            </CardHeader>
            <CardContent>
              {services.length > 0 ? (
                <div className="space-y-2">
                  {services.map(service => (
                    <div key={service.id} className="p-3 border rounded-lg">
                      <h4 className="font-medium">{service.name}</h4>
                      {service.description && (
                        <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No services selected</p>
              )}
            </CardContent>
          </Card>

          {/* Medical Record */}
          {medicalRecord && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Medical Record
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Blood Type</p>
                    <p className="text-gray-900">{medicalRecord.data.bloodType || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Insurance Provider</p>
                    <p className="text-gray-900">{medicalRecord.data.insurance?.provider || 'Not specified'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Allergies</p>
                  <div className="flex flex-wrap gap-2">
                    {medicalRecord.data.allergies?.map((allergy, index) => (
                      <span key={index} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                        {allergy}
                      </span>
                    )) || <span className="text-gray-500">None specified</span>}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Current Medications</p>
                  <div className="flex flex-wrap gap-2">
                    {medicalRecord.data.medications?.map((medication, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {medication}
                      </span>
                    )) || <span className="text-gray-500">None specified</span>}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Medical Conditions</p>
                  <div className="flex flex-wrap gap-2">
                    {medicalRecord.data.conditions?.map((condition, index) => (
                      <span key={index} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                        {condition}
                      </span>
                    )) || <span className="text-gray-500">None specified</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetails;
