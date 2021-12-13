import {MongoClient} from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@${process.env.MONGODB_CLUSTER}/${process.env.MONGODB_DATABASE}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const testConnection = async () => {
    try {
        await client.connect()

        console.log('Conectou ao mongodb com sucesso!');
    } catch (error) {
        console.error(error, 'Verifique se as variáveis de ambiente estão configuradas corretamente');
    }finally {
        await client.close();
    }
}

await testConnection().catch(console.error)

export default {
    client,
    db: client.db(process.env.MONGODB_DATABASE),
};