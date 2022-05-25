const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// middleware
app.use(cors());
app.use(express.json())

app.get('/', (req, res) => {
    res.send('Electro Manufacturing!')
})

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kh827.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        await client.connect();
        const toolsCollection = client.db("toolsCollection").collection("tools");
        const orderCollection = client.db("toolsCollection").collection("orders");
        const reviewCollection = client.db("toolsCollection").collection("reviews");
        const updateCollection = client.db("toolsCollection").collection("updateInfo");

        app.get('/tools', async (req, res) => {
            const query = {};
            const cursor = toolsCollection.find(query)
            const tools = await cursor.toArray();
            res.send(tools);
        })

        app.get('/tools/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const tool = await toolsCollection.findOne(query);
            res.send(tool);
        })

        app.post('/update', async (req, res) => {
            const orders = req.body;
            const updateInfo = await updateCollection.insertOne(orders);
            res.send(updateInfo)
        })

        app.post('/orders', async (req, res) => {
            const orders = req.body;
            const purchasesOrder = await orderCollection.insertOne(orders);
            res.send(purchasesOrder)
        })

        app.post('/review', async (req, res) => {
            const review = req.body;
            const userReview = await reviewCollection.insertOne(review);
            res.send(userReview)
        })

        app.get('/review', async (req, res) => {
            const query = {};
            const cursor = reviewCollection.find(query)
            const review = await cursor.toArray();
            res.send(review);
        })
        // app.post("/create-payment-intent", async (req, res) => {
        //     const { price } = req.body;
        //     console.log({ price });
        //     const amount = parseFloat(price * 100);
        //     const paymentIntent = await stripe.paymentIntents.create({
        //         amount: amount,
        //         currency: "usd",
        //         payment_method_types: ['card']
        //     });

        //     res.send({ clientSecret: paymentIntent.client_secret });
        // });

        app.get('/orders', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const cursor = orderCollection.find(query);
            const queryOrders = await cursor.toArray();
            res.send(queryOrders)
        })

        app.get('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const unPaidOrder = await orderCollection.findOne(query);
            res.send(unPaidOrder)
        })

        app.delete('/orders/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email }
            const deleteItem = await orderCollection.deleteOne(filter);
            res.send(deleteItem)
        })


    } finally {
        //   await client.close();
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`Example Electro Manufacturing listening on port ${port}`)
})