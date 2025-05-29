import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, User, FileText } from 'lucide-react';
import { doctorAPI } from '../../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import AppointmentDetails from '../../components/AppointmentDetails';

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

const Appointments: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [highlightedDays, setHighlightedDays] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);


  const initialMount = useRef(true);

  useEffect(() => {
    fetchCalendarData();
  }, [selectedDate]);

  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }
    fetchAppointments(selectedDate);
  }, [selectedDate]);

  const fetchCalendarData = async () => {
    const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
      .toISOString().split('T')[0];
    const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
      .toISOString().split('T')[0];

    try {
      const data = await doctorAPI.getCalendar(monthStart, monthEnd);
      setHighlightedDays(data);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    }
  };

  const fetchAppointments = async (date: Date) => {
    setLoading(true);
    // Increment the date by one day
    const adjustedDate = new Date(date);
    adjustedDate.setDate(adjustedDate.getDate() + 1);
    date = adjustedDate;
    const dateStr = date.toISOString().split('T')[0];
    
    try {
      const data = await doctorAPI.getAppointments(dateStr);
      setAppointments(data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const isWithinEditWindow = (appointmentTime: string) => {
    const appointmentDate = new Date(appointmentTime);
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);
    
    return appointmentDate >= today && appointmentDate <= sevenDaysFromNow;
  };

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
  };

  const handleCloseDetails = () => {
    setSelectedAppointment(null);
  };

  const handleAppointmentUpdate = () => {
    // Refresh appointments list
    fetchAppointments(selectedDate);
    fetchCalendarData();
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Appointments</h1>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
                modifiers={{
                  highlighted: (date) => {
                    const dateStr = date.toISOString().split('T')[0];
                    return highlightedDays.includes(dateStr);
                  }
                }}
                modifiersStyles={{
                  highlighted: {
                    backgroundColor: '#3b82f6',
                    color: 'white',
                  }
                }}
              />
            </CardContent>
          </Card>

          {/* Appointments List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Appointments for {selectedDate.toLocaleDateString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : appointments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No appointments for this date</p>
              ) : (
                <div className="space-y-4">
                  {appointments.map(appointment => (
                    <div 
                      key={appointment.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleAppointmentClick(appointment)}
                    >
                      <div className="flex items-center">
                        {appointment.user_photo ? (
                          <img
                            src={appointment.user_photo}
                            alt="User photo"
                            className="w-10 h-10 rounded-full object-cover mr-3"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{appointment.user_name || 'Patient'}</p>
                          <p className="text-sm text-gray-500">
                            {formatTime(appointment.appointment_time)} - {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-blue-600">
                        <FileText className="w-4 h-4 mr-2" />
                        <span className="text-sm">View Details</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <AppointmentDetails
          appointment={selectedAppointment}
          onClose={handleCloseDetails}
          onUpdate={handleAppointmentUpdate}
        />
      )}
    </div>
  );
};

export default Appointments;
