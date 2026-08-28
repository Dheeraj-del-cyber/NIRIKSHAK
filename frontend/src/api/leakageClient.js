import api from './client';

export const runHiddenLeakageDetection = () => api.post('/leakage/run');
export const runLeakageSimulate = (scenarioIndex = 0) => api.post('/leakage/simulate', { scenarioIndex });
export const getHiddenLeakageSummary = () => api.get('/leakage/summary');
export const getHiddenLeaks = (params = {}) => api.get('/leakage/hidden', { params });
