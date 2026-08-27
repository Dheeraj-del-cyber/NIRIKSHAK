import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const uploadInvoiceFile = (file) => {
  const form = new FormData();
  form.append('file', file);
  return api.post('/invoices/upload', form);
};

export const uploadGstFile = (file) => {
  const form = new FormData();
  form.append('file', file);
  return api.post('/gst/upload', form);
};

export const runAnalysis = () => api.post('/analysis/run');
export const simulateInvoice = () => api.post('/invoices/simulate');
export const getSummary = () => api.get('/analysis/summary');
export const getMismatches = (params = {}) => api.get('/analysis/mismatches', { params });
export const sendFeedback = (id, outcome) =>
  api.post(`/analysis/mismatches/${id}/feedback`, { outcome });
export const getJsonReportUrl = () => '/api/analysis/report/json';
export const getXmlReportUrl = () => '/api/analysis/report/xml';

export default api;
