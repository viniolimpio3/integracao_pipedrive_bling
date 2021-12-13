import mongodb from './connection.js';
import dotenv from 'dotenv';

dotenv.config();

export default {
    async createBlingCollection(request, response, next, isResjson = true){
        try {
            await mongodb.client.connect();

            const colName = 'Bling_Results';

            const collections = await mongodb.db.collections();

            if(!collections.map(c=> c.collectionName).includes(colName)){
                await mongodb.db.createCollection(colName);
                
                return isResjson ? response.json({
                    status: true,
                    message: `Collection ${colName} created!`,
                }).status(201) : true;

            } else {
                return isResjson ? response.json({
                    status: true,
                    message: `Collection ${colName} Alredy exists`,
                }).status(200) : true;
            }
            
        } catch (error) {
            return isResjson ? response.json({
                status: false,
                error: error,
            }).status(500) : false;
        } finally {
            mongodb.client.close();
        }
    },
}