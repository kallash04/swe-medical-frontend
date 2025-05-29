
import React, { useState, useEffect } from 'react';
import { User, FileText, Edit, ArrowLeft } from 'lucide-react';
import { doctorAPI, departmentsAPI } from '../../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Patient {
  id: string;
  name: string;
  email: string;
  profile_photo_url?: string;
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

const Patients: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedRecord, setEditedRecord] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const data = await doctorAPI.getPatients();
      setPatients(data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientRecord = async (patientId: string) => {
    try {
      const record = await doctorAPI.getPatientRecord(patientId);
      setMedicalRecord(record);
      setEditedRecord(record.data);
    } catch (error) {
      console.error('Error fetching patient record:', error);
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    fetchPatientRecord(patient.id);
  };

  const handleSaveRecord = async () => {
    if (!selectedPatient) return;
    
    setSaving(true);
    try {
      const updatedRecord = await doctorAPI.updatePatientRecord(selectedPatient.id, editedRecord);
      setMedicalRecord(updatedRecord);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating record:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateArrayField = (field: string, value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item);
    setEditedRecord(prev => ({ ...prev, [field]: items }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (selectedPatient && medicalRecord) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center mb-6">
            <Button 
              variant="outline" 
              onClick={() => setSelectedPatient(null)}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Patients
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">
              {selectedPatient.name}'s Medical Record
            </h1>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Medical Information</CardTitle>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Record
                  </Button>
                ) : (
                  <div className="space-x-2">
                    <Button onClick={handleSaveRecord} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blood Type
                  </label>
                  {isEditing ? (
                    <Input
                      value={editedRecord.bloodType || ''}
                      onChange={(e) => setEditedRecord(prev => ({ ...prev, bloodType: e.target.value }))}
                    />
                  ) : (
                    <p className="text-gray-900">{medicalRecord.data.bloodType || 'Not specified'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Insurance Provider
                  </label>
                  {isEditing ? (
                    <Input
                      value={editedRecord.insurance?.provider || ''}
                      onChange={(e) => setEditedRecord(prev => ({ 
                        ...prev, 
                        insurance: { ...prev.insurance, provider: e.target.value }
                      }))}
                    />
                  ) : (
                    <p className="text-gray-900">{medicalRecord.data.insurance?.provider || 'Not specified'}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allergies (comma-separated)
                  </label>
                  {isEditing ? (
                    <Textarea
                      value={editedRecord.allergies?.join(', ') || ''}
                      onChange={(e) => updateArrayField('allergies', e.target.value)}
                      placeholder="e.g., Penicillin, Peanuts"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {medicalRecord.data.allergies?.map((allergy, index) => (
                        <span key={index} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                          {allergy}
                        </span>
                      )) || <span className="text-gray-500">None specified</span>}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Medications (comma-separated)
                  </label>
                  {isEditing ? (
                    <Textarea
                      value={editedRecord.medications?.join(', ') || ''}
                      onChange={(e) => updateArrayField('medications', e.target.value)}
                      placeholder="e.g., Lisinopril 10mg, Metformin 500mg"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {medicalRecord.data.medications?.map((medication, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {medication}
                        </span>
                      )) || <span className="text-gray-500">None specified</span>}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medical Conditions (comma-separated)
                  </label>
                  {isEditing ? (
                    <Textarea
                      value={editedRecord.conditions?.join(', ') || ''}
                      onChange={(e) => updateArrayField('conditions', e.target.value)}
                      placeholder="e.g., Hypertension, Type 2 Diabetes"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {medicalRecord.data.conditions?.map((condition, index) => (
                        <span key={index} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                          {condition}
                        </span>
                      )) || <span className="text-gray-500">None specified</span>}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Patients</h1>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients.map(patient => (
            <Card key={patient.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center">
                  {patient.profile_photo_url ? (
                    <img
                      src={patient.profile_photo_url}
                      alt={patient.name}
                      className="w-12 h-12 rounded-full object-cover mr-4"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-lg">{patient.name}</CardTitle>
                    <CardDescription>{patient.email}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => handlePatientSelect(patient)}
                  className="w-full"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View Medical Record
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Patients;
