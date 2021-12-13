import pipedrive from '../services/apiPipedrive.js'
import bling from '../services/apiBling.js';
import dotenv from 'dotenv';
import xmlbuilder from 'xmlbuilder';
import mongodb from '../database/connection.js';
import utf8 from 'utf8'
import collection from '../database/collections.js';


dotenv.config();

/**
 * Get Deals from PipeDrive account
 */
async function getDeals(){
    const params = {
        api_token: process.env.PIPEDRIVE_API_KEY
    }
    const deals = await pipedrive.get('/deals', {params})


    return deals.data
}

/**
 * Faz a tratativa dos dados do pipdrive para gerar xml de um pedido no bling
 * @param d 
 * @returns 
 */
function getDealObject(d){
    return {
        pedido:{
            data: {
                '#text': new Date(d.won_time).toLocaleDateString()
            },
            cliente: {
                nome: {
                    '#text': d.person_name
                },
            },
            itens:{
                item: {
                    codigo:{
                        '#text': d.id
                    },
                    descricao: {
                        '#text': d.title
                    },
                    qtde: {
                        '#text': d.products_count
                    },
                    vlr_unit: {
                        '#text': d.value
                    }
                }
            },
            transporte:{
                volumes: {
                    volume: {
                        servico:{
                            '#text': d.title
                        }
                    }
                }
            },
            codigo:d.id,
        }
    };
}

/**
 * Insert order on Bling
 */
async function insertOrders(deals){
    const params = {
        apikey: process.env.BLING_API_KEY,
    };


    let status = true;
    deals.forEach(async function(value, index){

        let objectXml = getDealObject(value)

        params.xml = xmlbuilder.create(objectXml, {
            version: '1.0',
            encoding: 'utf-8'
        }).end({pretty: true});

        params.xml = utf8.encode(params.xml)

        let blingresponse = await bling.post(`/pedido/json?apikey=${params.apikey}&xml=${params.xml}&gerarnfe=false`); 

        if(blingresponse.status != 201 && blingresponse.status != 200){
            status = false;
            return;
        }

        return blingresponse;
    })

    return status;
}

/**
 * Busca os pedidos do bling
 */
async function getOrders(){
    const params = {
        apikey: process.env.BLING_API_KEY
    }

    const orders = await bling.get('/pedidos/json', {params})
    return orders.data
}

/**
* Processa os deals (oportunidades) do pipdrive e insere-as no bling
*/
async function processDeals (){
   const deals = await getDeals();
   
   if(!deals || !deals.success){
       return response.json({
           message: 'Erro ao buscar Deals do pipedrive!'
       }).status(500);
   }

   const dealsWon = deals.data.filter( d => d.status == 'won')


   if(dealsWon.length == 0){
       return response.json({
           message: 'No deals with status "won" Found!'
       }).status(200);
   }

   //Inserindo pedidos
   return await insertOrders(dealsWon);
}


async function insertOrdersOnDB(pedidos){

    //criando a collection, caso não tenha rodado na rota
    await collection.createBlingCollection(false, false, false, false);
    try{
        await mongodb.client.connect();

        const results = mongodb.db.collection('Bling_Results')

        const valuesInsert = []

        pedidos.forEach(async (pedido, index) => {

            pedido = pedido.pedido
            let search  = await results.find({'numero': pedido.numero}).count()
            
            if(search > 0){

                results.updateOne({'numero': pedido.numero}, {
                    data: pedido.data,
                    numero: pedido.numero,
                    valor: pedido.totalvenda,
                })

            }else {
                valuesInsert.push({
                    data: pedido.data,
                    numero: pedido.numero,
                    valor: pedido.totalvenda,
                })
            }

        })

        if(valuesInsert.length > 0)
            await results.insertMany(valuesInsert)

    }catch(ex){
        console.log(ex)
        return false;

    }finally {
        mongodb.client.close();
    }

    return true;
}


async function getResults(){
    try{
        await mongodb.client.connect();

        const results = mongodb.db.collection('Bling_Results')

        let res = await results.aggregate([{
            $group: {
                _id: { data: "$data" },
                valorTotal: {$sum: "$valor"},
                qtdVendas: {$sum: 1}
            }
        }])

        return res;
    }catch(ex){
        console.log(ex)
        return false;

    }finally {
        mongodb.client.close();
    }
}


export default {
    /**
     * Agrupa os valores na collection do mongoDB por dia e retorna
     * @param {*} request 
     * @param {*} response 
     */
    getDayValues: async function(request, response){

        //processa os deals do pipdrive para o bling
        await processDeals();

        const orders = await getOrders();

        if(!orders.retorno || !orders.retorno.pedidos)
            return response.json({
                status: false,
                message: 'No orders created',
            });

        //Inserindo valores no banco
        await insertOrdersOnDB(orders.retorno.pedidos);

        const result = await getResults();

        if(!result)
            return response.json({
                status: false,
                message: 'Fail',
            })

        return response.json(result);
    },
}
