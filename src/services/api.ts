const API_BASE_URL = 'http://18.199.132.234:3223';

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Set auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Generic API request handler
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
};

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await apiRequest<{
      data: { user: any; token: string };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return response.data;
  },

  register: async (name: string, email: string, password: string) => {
    const response = await apiRequest<{
      data: { user: any };
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    return response.data;
  },
};

// Departments API
export const departmentsAPI = {
  getDepartments: async () => {
    const response = await apiRequest<{
      data: { departments: any[] };
    }>('/departments');
    return response.data.departments;
  },
};

// Services API
export const servicesAPI = {
  getServices: async () => {
    const response = await apiRequest<{
      data: { services: any[] };
    }>('/services');
    return response.data.services;
  },
};

// User API
export const userAPI = {
  getProfile: async () => {
    const response = await apiRequest<{
      data: { user: { user: any; record: any } };
    }>('/user/profile');
    return response.data.user;
  },

  updateProfile: async (name: string, profile_photo_url?: string) => {
    const response = await apiRequest<{
      data: { user: any };
    }>('/user/profile', {
      method: 'PATCH',
      body: JSON.stringify({ name, profile_photo_url }),
    });
    return response.data.user;
  },

  getDoctors: async (departmentId?: string) => {
    const params = departmentId ? `?departmentId=${departmentId}` : '';
    const response = await apiRequest<{
      data: { doctors: any[] };
    }>(`/user/doctors${params}`);
    return response.data.doctors;
  },

  getMedicalRecord: async () => {
    const response = await apiRequest<{
      data: { record: any };
    }>('/user/record');
    return response.data.record;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await apiRequest<{
      data: { message: string };
    }>('/user/profile/password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return response.data;
  },
};

// Appointments API
export const appointmentsAPI = {
  getDoctorAvailability: async (doctorId: string, monthStart: string, monthEnd: string) => {
    const response = await apiRequest<{
      data: { days: string[] };
    }>(`/appointments/calendar?doctorId=${doctorId}&monthStart=${monthStart}&monthEnd=${monthEnd}`);
    return response.data.days;
  },

  getDoctorSlots: async (doctorId: string, date: string) => {
    const response = await apiRequest<{
      data: { slots: string[] };
    }>(`/appointments/slots?doctorId=${doctorId}&date=${date}`);
    return response.data.slots;
  },

  bookAppointment: async (doctorId: string, appointmentTime: string, serviceIds: string[] = []) => {
    const response = await apiRequest<{
      data: { booking: any };
    }>('/appointments', {
      method: 'POST',
      body: JSON.stringify({ doctorId, appointmentTime, serviceIds }),
    });
    return response.data.booking;
  },
};

// History API
export const historyAPI = {
  getHistory: async () => {
    const response = await apiRequest<{
      data: { history: any[] };
    }>('/history');
    return response.data.history;
  },
};

// AI API
export const aiAPI = {
  classify: async (text: string) => {
    const response = await apiRequest<{
      data: { 
        departmentId: {
          UUID: string;
          explanation: string;
        }
      };
    }>('/api/ai/classify', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
    return response.data;
  },
};

// Doctor API
export const doctorAPI = {
  getPatients: async () => {
    const response = await apiRequest<{
      data: { patients: any[] };
    }>('/doctor/patients');
    return response.data.patients;
  },

  getPatientRecord: async (patientId: string) => {
    const response = await apiRequest<{
      data: { record: any };
    }>(`/doctor/patients/${patientId}/record`);
    return response.data.record;
  },

  updatePatientRecord: async (patientId: string, data: any) => {
    const response = await apiRequest<{
      data: { record: any };
    }>(`/doctor/patients/${patientId}/record`, {
      method: 'PUT',
      body: JSON.stringify({ data }),
    });
    return response.data.record;
  },

  getAvailability: async () => {
    const response = await apiRequest<{
      data: { availability: any[] };
    }>('/availability');
    return response.data.availability;
  },

  setAvailability: async (blocks: any[]) => {
    const response = await apiRequest<{
      data: { availability: any[] };
    }>('/availability', {
      method: 'POST',
      body: JSON.stringify({ blocks }),
    });
    return response.data.availability;
  },

  clearDayAvailability: async (dayOfWeek: number) => {
    const response = await apiRequest<{
      data: {};
    }>(`/availability/${dayOfWeek}`, {
      method: 'DELETE',
    });
    return response.data;
  },

  getCalendar: async (monthStart: string, monthEnd: string) => {
    const response = await apiRequest<{
      data: { days: string[] };
    }>(`/doctor/calendar?monthStart=${monthStart}&monthEnd=${monthEnd}`);
    return response.data.days;
  },

  getAppointments: async (date: string) => {
    const response = await apiRequest<{
      data: { appointments: any[] };
    }>(`/doctor/appointments?date=${date}`);
    return response.data.appointments;
  },

  getAppointmentServices: async (appointmentId: string) => {
    const response = await apiRequest<{
      data: { services: any[] };
    }>(`/appointments/services/${appointmentId}`);
    return response.data.services;
  },

  cancelAppointment: async (appointmentId: string) => {
    const response = await apiRequest<{
      data: { appointment: any };
    }>(`/appointments/${appointmentId}/cancel`, {
      method: 'POST',
    });
    return response.data.appointment;
  },

  completeAppointment: async (appointmentId: string) => {
    const response = await apiRequest<{
      data: { appointment: any };
    }>(`/appointments/${appointmentId}/complete`, {
      method: 'POST',
    });
    return response.data.appointment;
  },
};

// Admin API
export const adminAPI = {
  getUsers: async () => {
    const response = await apiRequest<{
      data: { users: any[] };
    }>('/admin/users');
    return response.data.users;
  },

  createUser: async (name: string, email: string, password: string) => {
    const response = await apiRequest<{
      data: { user: any };
    }>('/admin/users', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    return response.data.user;
  },

  changeUserPassword: async (userId: string, password: string) => {
    const response = await apiRequest<{
      data: { user: any };
    }>(`/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ password }),
    });
    return response.data.user;
  },

  deleteUser: async (userId: string) => {
    const response = await apiRequest<{
      data: {};
    }>(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
    return response.data;
  },

  getDoctors: async () => {
    const response = await apiRequest<{
      data: { doctors: any[] };
    }>('/admin/doctors');
    return response.data.doctors;
  },

  createDoctor: async (name: string, email: string, password: string, department_id: string) => {
    const response = await apiRequest<{
      data: { doctor: any };
    }>('/admin/doctors', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, department_id }),
    });
    return response.data.doctor;
  },

  getUnassignedUsers: async () => {
    const response = await apiRequest<{
      data: { users: any[] };
    }>('/admin/unassigned');
    return response.data.users;
  },

  assignDoctor: async (userId: string, doctorId: string) => {
    const response = await apiRequest<{
      data: { user: any };
    }>('/admin/assign', {
      method: 'PATCH',
      body: JSON.stringify({ userId, doctorId }),
    });
    return response.data.user;
  },
};
