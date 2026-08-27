import api from './client';

export const runDigitalTwin = () => api.post('/twin/run');
export const getTwinSummary = () => api.get('/twin/summary');
export const getTwinSnapshots = (params = {}) => api.get('/twin/snapshots', { params });
