import express from 'express';
import routes from './routes.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());


//app.use(cors) //install cors!

app.use(express.urlencoded({extended:true}));

app.use(routes);

const port = process.env.PORT;
const host  = process.env.HOST;

app.listen(port, function(){
    console.log(`Running at ${host}:${port}`)
})