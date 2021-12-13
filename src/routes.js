import express from "express";
import collection from './database/collections.js';
import ProccessData from "./controllers/ProccessData.js";
const routes = express.Router();

//Cria a collection que armazena os resultados no Bling por dia
routes.get('/collection/create', collection.createBlingCollection);

routes.get('/deals', ProccessData.getDayValues);

routes.get('/teste', function(req, res, next){
    return res.json({teste: 'success'}).status(200);
})


export default routes;