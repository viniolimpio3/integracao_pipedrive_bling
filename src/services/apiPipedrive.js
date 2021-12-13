import axios from 'axios';
import dotenv from 'dotenv';
export default axios.create({
    baseURL: process.env.PIPEDRIVE_API_BASE_URL,
});