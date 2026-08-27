import api from './client';

export const simulateRecovery = () => api.post('/recovery/simulate');
export const runAutonomousRecoveryAgent = () => api.post('/recovery/run');
export const getRecoverySummary = () => api.get('/recovery/summary');
export const getRecoveryWorkflows = (params = {}) => api.get('/recovery/workflows', { params });
export const updateWorkflowStatus = (id, status) => api.patch(`/recovery/workflows/${id}/status`, { status });
