import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_BASE,
    timeout: 120000,
});

export const predictImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/predict-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const detectYoloImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/detect-yolo-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const detectVideo = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/detect-video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const webcamDetection = async (frameBase64, confThreshold = 0.25) => {
    const response = await api.post('/webcam-detection', {
        frame: frameBase64,
        conf_threshold: confThreshold,
    });
    return response.data;
};

export const getMetrics = async () => {
    const response = await api.get('/metrics');
    return response.data;
};

export const getTrainingHistory = async () => {
    const response = await api.get('/metrics/training-history');
    return response.data;
};

export const getEvaluationMetrics = async () => {
    const response = await api.get('/metrics/evaluation');
    return response.data;
};

// ====== Advanced Analytics APIs ======

export const getGradCAM = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/gradcam', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const getClientData = async () => {
    const response = await api.get('/analytics/clients');
    return response.data;
};

export const getErrorAnalysis = async () => {
    const response = await api.get('/analytics/errors');
    return response.data;
};

export const getDatasetStats = async () => {
    const response = await api.get('/analytics/dataset');
    return response.data;
};

export default api;
