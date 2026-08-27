import api from './client';

export const runHiddenLeakageDetection = () => api.post('/leakage/run');
export const getHiddenLeakageSummary = () => api.get('/leakage/summary');
export const getHiddenLeaks = (params = {}) => api.get('/leakage/hidden', { params });
