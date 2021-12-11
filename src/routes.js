import express from "express";

const routes = express.Router();

//Rotas da API
routes.get('/teste', function(req, res, next){
    return res.json({teste: 'success'}).status(200);
})


export default routes;