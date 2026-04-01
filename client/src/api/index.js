import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

// 请求拦截器 - 添加 Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const login = (data) => api.post('/auth/login', data);
export const changePassword = (data) => api.post('/auth/change-password', data);
export const getCurrentUser = () => api.get('/auth/me');

// User APIs
export const getUsers = () => api.get('/auth/users');
export const createUser = (data) => api.post('/auth/users', data);
export const updateUser = (id, data) => api.put(`/auth/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/auth/users/${id}`);

// Teacher APIs
export const getTeachers = (params) => api.get('/teachers', { params });
export const getTeacher = (id) => api.get(`/teachers/${id}`);
export const createTeacher = (data) => api.post('/teachers', data);
export const updateTeacher = (id, data) => api.put(`/teachers/${id}`, data);
export const deleteTeacher = (id) => api.delete(`/teachers/${id}`);

// Course Type APIs
export const getCourseTypes = (params) => api.get('/course-types', { params });
export const getCourseType = (id) => api.get(`/course-types/${id}`);
export const createCourseType = (data) => api.post('/course-types', data);
export const updateCourseType = (id, data) => api.put(`/course-types/${id}`, data);
export const deleteCourseType = (id) => api.delete(`/course-types/${id}`);

// Student APIs
export const getStudents = (params) => api.get('/students', { params });
export const getStudent = (id) => api.get(`/students/${id}`);
export const createStudent = (data) => api.post('/students', data);
export const updateStudent = (id, data) => api.put(`/students/${id}`, data);
export const deleteStudent = (id) => api.delete(`/students/${id}`);

// Course APIs
export const recharge = (data) => api.post('/courses/recharge', data);
export const getRecharges = (params) => api.get('/courses/recharges', { params });

export const signIn = (data) => api.post('/courses/signin', data);
export const getCourseLogs = (params) => api.get('/courses/logs', { params });
export const deleteCourseLog = (id) => api.delete(`/courses/logs/${id}`);

export const getCourseStats = () => api.get('/courses/stats');
export const getLowBalance = () => api.get('/courses/low-balance');

// Transaction APIs
export const getTransactions = (params) => api.get('/transactions', { params });
export const createTransaction = (data) => api.post('/transactions', data);
export const updateTransaction = (id, data) => api.put(`/transactions/${id}`, data);
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`);
export const getTransactionStats = (params) => api.get('/transactions/stats', { params });
export const getTransactionCategories = () => api.get('/transactions/categories');

// Salary APIs
export const getSalaries = (params) => api.get('/transactions/salary', { params });
export const generateSalary = (data) => api.post('/transactions/salary/generate', data);
export const paySalary = (id) => api.post('/transactions/salary/pay', { id });
export const getTeacherMonthDetail = (teacherId, month) =>
  api.get(`/transactions/teacher-month/${teacherId}/${month}`);

export default api;