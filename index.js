const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
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
        const reviewCollection = client.db('luxe-matches').collection('reviews');

        // jwt related api
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
            res.send({ token });
        });

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

        app.get('/success-stories', async (req, res) => {
            const result = await reviewCollection.find().toArray();
            res.send(result);
        });

        app.get('/users-bio-data', async (req, res) => {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const gender = req.query.gender;
            const division = req.query.division;
            const minAge = parseInt(req.query.minAge) || 18;
            const maxAge = parseInt(req.query.maxAge) || 99;
            const skip = (page - 1) * limit;
            const query = {
                ...(gender && { 'bioData.bioDataType': gender }),
                ...(division && { 'bioData.presentDivision': division }),
                'bioData.age': { $gte: minAge, $lte: maxAge }
            };
            const users = await userCollection
                .find(query)
                .skip(+skip)
                .limit(+limit)
                .toArray();
            const count = await userCollection.estimatedDocumentCount();
            res.send({ users, count });
        });

        //user related api
        app.get('/get-bio-data/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await userCollection.findOne(query);
            const count = await userCollection.estimatedDocumentCount();
            res.send({ result, count });
        });

        app.post('/make-bio-data-premium-request', async (req, res) => {
            const { bioData } = req.body;
            const result = await requestCollection.insertOne(bioData);
            res.send(result);
        });

        app.post('/user/success-stories', async (req, res) => {
            const story = { ...req.body, approved: false };
            const result = reviewCollection.insertOne(story);
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
        // admin related apis
        app.get('/admin-stats', async (req, res) => {
            // const paymentCol = req.app.locals.db.collection('payments');       // Stripe logs here

            const pipeline = [
                { $match: { bioData: { $exists: true } } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        male: { $sum: { $cond: [{ $eq: ['$bioData.bioDataType', 'Male'] }, 1, 0] } },
                        female: { $sum: { $cond: [{ $eq: ['$bioData.bioDataType', 'Female'] }, 1, 0] } },
                        premium: { $sum: { $cond: [{ $eq: ['$isPremium', true] }, 1, 0] } }
                    }
                },
                { $project: { _id: 0 } }
            ];

            const [bioDataStats = { total: 0, male: 0, female: 0, premium: 0 }] =
                await userCollection.aggregate(pipeline).toArray();

            /* ---------- 2.  revenue ---------- */
            // const revenueAgg = await paymentCol.aggregate([
            //     { $match: { status: 'succeeded' } },            // only successful Stripe payments
            //     { $group: { _id: null, revenue: { $sum: '$amountUsd' } } },
            //     { $project: { _id: 0, revenue: 1 } }
            // ]).toArray();

            // const revenue = revenueAgg[0]?.revenue || 0;

            /* ---------- 3.  send JSON ---------- */
            res.json({
                total: bioDataStats.total,
                male: bioDataStats.male,
                female: bioDataStats.female,
                premium: bioDataStats.premium,
                revenue: 1000,
            });
        });
        app.get('/premium-requests', async (req, res) => {
            const result = await requestCollection.find().toArray();
            res.send(result);
        });

        app.get('/admin/manage-users', async (req, res) => {
            const { q = '', page = 1, limit = 10 } = req.query;
            const skip = (page - 1) * limit;
            const query = q
                ? { name: { $regex: q, $options: 'i' } }
                : {};

            const users = await userCollection
                .find(query)
                .skip(+skip)
                .limit(+limit)
                .toArray();

            res.send(users);
        });

        app.get('/admin/success-stories', async (req, res) => {
            const result = await reviewCollection.find().toArray();
            res.send(result);
        });

        app.patch('/make-admin/make-premium/:id', async (req, res) => {
            const { isAdmin, isPremium } = req.body;
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const update = {
                $set: { isAdmin: !!isAdmin, isPremium: !!isPremium }
            };
            const result = await userCollection.updateOne(filter, update);
            res.send(result);
        });

        app.patch('/admin/premium-requests/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateBioData = {
                $set: {
                    isPremium: true,
                }
            };
            const result = await userCollection.updateOne(filter, updateBioData);
            const change = await requestCollection.deleteOne(id);
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