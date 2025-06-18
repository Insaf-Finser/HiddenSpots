import axios from 'axios';

const API_BASE_URL = 'https://your-backend-api-url.com/api'; // Replace with your actual backend API URL

export const getHiddenSpots = async (latitude, longitude) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/hidden-spots`, {
            params: {
                lat: latitude,
                long: longitude,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching hidden spots:', error);
        throw error;
    }
};

export const getSpotDetails = async (spotId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/hidden-spots/${spotId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching spot details:', error);
        throw error;
    }
};

export const submitNewSpot = async (spotData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/hidden-spots`, spotData);
        return response.data;
    } catch (error) {
        console.error('Error submitting new spot:', error);
        throw error;
    }
};

export const rateSpot = async (spotId, ratingData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/hidden-spots/${spotId}/rate`, ratingData);
        return response.data;
    } catch (error) {
        console.error('Error rating spot:', error);
        throw error;
    }
};

export const submitExperience = async (spotId, experienceData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/hidden-spots/${spotId}/experiences`, experienceData);
        return response.data;
    } catch (error) {
        console.error('Error submitting experience:', error);
        throw error;
    }
};