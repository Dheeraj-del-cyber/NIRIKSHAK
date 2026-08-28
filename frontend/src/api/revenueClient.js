import api from './client';

function uploadFile(path, file) {
    const form = new FormData();
    form.append('file', file);
    return api.post(path, form);
}

export const uploadTransactions = (file) => uploadFile('/revenue/transactions/upload', file);
export const uploadPayments = (file) => uploadFile('/revenue/payments/upload', file);
export const uploadCustomers = (file) => uploadFile('/revenue/customers/upload', file);

export const runRevenueAnalysis = () => api.post('/revenue/run');
export const runRevenueSimulate = (scenarioIndex = 0) => api.post('/revenue/simulate', { scenarioIndex });
export const getRevenueSummary = () => api.get('/revenue/summary');
export const getRevenueLeaks = (params = {}) => api.get('/revenue/leaks', { params });