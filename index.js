const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.port || 5000;

//middlewares
app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    credentials: true
}));
app.use(express.json());



const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qvjjrvn.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        const userCollection = client.db('luxe-matches').collection('users');
        const requestCollection = client.db('luxe-matches').collection('requests');

        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user?.email };
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'user already exists', insertedId: null })
            }
            const result = await userCollection.insertOne(user);
            res.send(result);
        });

        //user related api
        app.get('/get-bio-data/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await userCollection.findOne(query);
            res.send(result);
        });

        app.post('/make-bio-data-premium-request', async (req, res) => {
            const { bioData } = req.body;
            const result = await requestCollection.insertOne(bioData);
            res.send(result);
        });

        app.patch('/bio-data-edit/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const bioData = req.body;
            const updateBioData = {
                $set: { bioData }
            };
            const result = await userCollection.updateOne(query, updateBioData);
            res.send(result);
        });

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('LuxeMatches is loving');
});

app.listen(port, () => {
    console.log(`server is running on ${port}`);
});