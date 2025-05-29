import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Search, Sparkles, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI, appointmentsAPI, aiAPI, departmentsAPI, servicesAPI } from '../../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';

interface Department {
  id: string;
  name: string;
}

interface Doctor {
  id: string;
  name: string;
  department_id: string;
  profile_photo_url?: string;
  role: string;
}

interface Service {
  id: string;
  name: string;
  fee: number;
}

const Doctors: React.FC = () => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [aiDescription, setAiDescription] = useState('');
  const [aiExplanation, setAiExplanation] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Appointment booking state
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isBooking, setIsBooking] = useState(false);
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);

  useEffect(() => {
    fetchDepartments();
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDepartment && selectedDepartment !== 'all') {
      fetchDoctors(selectedDepartment);
    } else {
      fetchDoctors();
    }
  }, [selectedDepartment]);

  const fetchDepartments = async () => {
    try {
      const data = await departmentsAPI.getDepartments();
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchDoctors = async (departmentId?: string) => {
    try {
      const data = await userAPI.getDoctors(departmentId);
      
      // Sort so assigned doctor appears first
      const sortedDoctors = data.sort((a: Doctor, b: Doctor) => {
        if (a.id === user?.assigned_doctor_id) return -1;
        if (b.id === user?.assigned_doctor_id) return 1;
        return 0;
      });
      
      setDoctors(sortedDoctors);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAIClassification = async () => {
    if (!aiDescription.trim()) return;
    
    setIsProcessingAI(true);
    setAiExplanation('');
    try {
      const data = await aiAPI.classify(aiDescription);
      setSelectedDepartment(data.departmentId.UUID);
      setAiExplanation(data.departmentId.explanation);
      
      // Scroll to doctors section
      const doctorsSection = document.getElementById('doctors-grid');
      if (doctorsSection) {
        doctorsSection.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Error classifying issue:', error);
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleMakeAppointment = async (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setSelectedDate(undefined);
    setSelectedSlot('');
    setSelectedServices([]);
    setAvailableDates([]);
    setAvailableSlots([]);
    
    // Get available dates for the next month
    setLoadingDates(true);
    try {
      const today = new Date();
      const monthStart = today.toISOString().split('T')[0];
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
      const monthEndStr = monthEnd.toISOString().split('T')[0];
      
      const dates = await appointmentsAPI.getDoctorAvailability(doctor.id, monthStart, monthEndStr);
      setAvailableDates(dates);
    } catch (error) {
      console.error('Error fetching available dates:', error);
      alert('Failed to load available dates. Please try again.');
    } finally {
      setLoadingDates(false);
    }

    // Fetch services
    setLoadingServices(true);
    try {
      const servicesData = await servicesAPI.getServices();
      setServices(servicesData);
    } catch (error) {
      console.error('Error fetching services:', error);
      alert('Failed to load services. Please try again.');
    } finally {
      setLoadingServices(false);
    }
  };

  const handleDateSelect = async (date: Date | undefined) => {
  setSelectedDate(date);
  setSelectedSlot('');
  setAvailableSlots([]);

  if (!selectedDoctor || !date) return;

  setLoadingSlots(true);
  try {
    // 1) take the year/month/day of the *local* Date
    const y = date.getFullYear();
    const m = date.getMonth();
    const d = date.getDate();

    // 2) build a new Date at UTC midnight of that same Y/M/D
    const utcMidnight = new Date(Date.UTC(y, m, d));

    // 3) extract YYYY-MM-DD from the UTC date
    const dateStr = utcMidnight.toISOString().split('T')[0];

    // now query the slots for the correct UTC date
    const slots = await appointmentsAPI.getDoctorSlots(
      selectedDoctor.id,
      dateStr
    );

    setAvailableSlots(slots);
  } catch (error) {
    console.error('Error fetching available slots:', error);
    alert('Failed to load available time slots. Please try again.');
  } finally {
    setLoadingSlots(false);
  }
};


  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };
  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot || !user || selectedServices.length === 0) return;

    setIsBooking(true);
    try {
      const selectedDateStr = selectedDate.toISOString().split('T')[0]; // Ensure UTC formatting
      const selectedTimeStr = new Date(selectedSlot).toISOString().split('T')[1];
      const fullDateTimeStr = `${selectedDateStr}T${selectedTimeStr}`;

      await appointmentsAPI.bookAppointment(selectedDoctor.id, fullDateTimeStr, selectedServices);

      alert('Appointment booked successfully!');
      setSelectedDoctor(null);
      setSelectedDate(undefined);
      setSelectedSlot('');
      setSelectedServices([]);
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Failed to book appointment. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const getDepartmentName = (departmentId: string) => {
    const dept = departments.find(d => d.id === departmentId);
    return dept?.name || 'Unknown Department';
  };

  const formatDateForDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isDateAvailable = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return availableDates.includes(dateStr);
  };

  const getTotalFee = () => {
    const total = selectedServices.reduce((sum, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      const fee = Number(service?.fee || 0);
      return sum + fee;
    }, 0);
    return Number(total).toFixed(2);
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
        {/* AI-Powered Department Filter */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="w-6 h-6 text-purple-600 mr-2" />
              Describe your issue and we'll recommend the right department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex space-x-4">
                <Input
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  placeholder="e.g., I have chest pain and shortness of breath..."
                  className="flex-1"
                />
                <Button
                  onClick={handleAIClassification}
                  disabled={isProcessingAI || !aiDescription.trim()}
                >
                  {isProcessingAI ? 'Processing...' : 'Find Department'}
                </Button>
              </div>
              
              {aiExplanation && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">AI Recommendation:</h4>
                  <p className="text-blue-800">{aiExplanation}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Department Filter */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filter by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-full md:w-auto">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Doctors Grid */}
        <div id="doctors-grid" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map(doctor => (
            <Card 
              key={doctor.id} 
              className={`hover:shadow-xl transition-all duration-300 ${
                doctor.id === user?.assigned_doctor_id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <CardHeader>
                {doctor.id === user?.assigned_doctor_id && (
                  <div className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full mb-3 inline-block w-fit">
                    Your Assigned Doctor
                  </div>
                )}
                
                <div className="flex items-center">
                  {doctor.profile_photo_url ? (
                    <img
                      src={doctor.profile_photo_url}
                      alt={doctor.name}
                      className="w-16 h-16 rounded-full object-cover mr-4"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      <User className="w-8 h-8 text-blue-600" />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-lg">{doctor.name}</CardTitle>
                    <CardDescription>{getDepartmentName(doctor.department_id)}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleMakeAppointment(doctor)}
                  className="w-full"
                >
                  Make Appointment
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Appointment Booking Modal */}
        {selectedDoctor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Book Appointment with {selectedDoctor.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Calendar Date Selection */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Select Date</h4>
                  {loadingDates ? (
                    <div className="text-center py-4">Loading available dates...</div>
                  ) : (
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today || !isDateAvailable(date);
                      }}
                      modifiers={{
                        available: (date) => isDateAvailable(date)
                      }}
                      modifiersStyles={{
                        available: { 
                          backgroundColor: '#16a34a',
                          color: 'white'
                        }
                      }}
                      className="rounded-md border pointer-events-auto"
                    />
                  )}
                </div>

                {/* Time Slot Selection */}
                {selectedDate && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Select Time</h4>
                    {loadingSlots ? (
                      <div className="text-center py-4">Loading available times...</div>
                    ) : availableSlots.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">No available time slots</div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {availableSlots.map(slot => (
                          <Button
                            key={slot}
                            onClick={() => setSelectedSlot(slot)}
                            variant={selectedSlot === slot ? "default" : "outline"}
                            size="sm"
                            className="p-2 text-sm"
                          >
                            {new Date(slot).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Service Selection */}
                {selectedSlot && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Select Services</h4>
                    {loadingServices ? (
                      <div className="text-center py-4">Loading services...</div>
                    ) : services.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">No services available</div>
                    ) : (
                      <div className="space-y-3">
                        {services.map(service => (
                          <div key={service.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                            <Checkbox
                              id={service.id}
                              checked={selectedServices.includes(service.id)}
                              onCheckedChange={() => handleServiceToggle(service.id)}
                            />
                            <label 
                              htmlFor={service.id}
                              className="flex-1 cursor-pointer"
                            >
                              <div className="font-medium">{service.name}</div>
                              <div className="text-sm text-gray-500">${service.fee}</div>
                            </label>
                          </div>
                        ))}
                        {selectedServices.length > 0 && (
                          <div className="text-right font-medium text-lg">
                            Total: ${getTotalFee()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <Button
                    onClick={() => setSelectedDoctor(null)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleBookAppointment}
                    disabled={!selectedDate || !selectedSlot || selectedServices.length === 0 || isBooking}
                    className="flex-1"
                  >
                    {isBooking ? 'Booking...' : `Book Appointment - $${getTotalFee()}`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Doctors;
