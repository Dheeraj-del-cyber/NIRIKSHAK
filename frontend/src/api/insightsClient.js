import api from './client';

export const getLeakageHeatmap = () => api.get('/insights/heatmap');
export const getFutureLeakagePrediction = () => api.get('/insights/forecast');
export const getInsightsSummary = () => api.get('/insights/summary');
