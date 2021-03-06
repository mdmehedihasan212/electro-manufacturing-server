const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json())

app.get('/', (req, res) => {
    res.send('Electro Manufacturing!')
})

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kh827.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized access' })
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.JWT_SECRET_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next();
    });
}

async function run() {
    try {
        await client.connect();
        const toolsCollection = client.db("toolsCollection").collection("tools");
        const orderCollection = client.db("toolsCollection").collection("orders");
        const reviewCollection = client.db("toolsCollection").collection("reviews");
        const updateCollection = client.db("toolsCollection").collection("updateInfo");
        const userCollection = client.db("toolsCollection").collection("users");
        const paymentCollection = client.db("toolsCollection").collection("payments");

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

        app.delete('/tools/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const deleteProduct = await toolsCollection.deleteOne(filter);
            res.send(deleteProduct)
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

        app.post('/add-product', async (req, res) => {
            const product = req.body;
            const addProduct = await toolsCollection.insertOne(product);
            res.send(addProduct)
        });

        app.post("/create-payment-intent", async (req, res) => {
            const price = req.body.price;
            const amount = price * 100;
            // Create a PaymentIntent with the order amount and currency
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types: ['card']
            });

            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        app.put('/user/admin/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const updateDoc = {
                $set: { role: 'admin' }
            };
            const result = await userCollection.updateOne(filter, updateDoc)
            res.send(result);
        })

        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user
            };
            const result = await userCollection.updateOne(filter, updateDoc, options)
            const token = jwt.sign({ email: email }, process.env.JWT_SECRET_TOKEN, { expiresIn: '1d' });
            res.send({ result, token });
        })

        app.patch('/order/:id', async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const filter = { _id: ObjectId(id) };
            const updateDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.id
                }
            }
            const updatePayment = await orderCollection.updateOne(filter, updateDoc)
            const result = await paymentCollection.insertOne(payment)
            res.send(updateDoc)
        })

        app.get('/payment', verifyToken, async (req, res) => {
            const query = {};
            const payments = await paymentCollection.find(query).toArray();
            res.send(payments);
        })

        app.get('/user', verifyToken, async (req, res) => {
            const query = {};
            const users = await userCollection.find(query).toArray();
            res.send(users);
        })

        app.get('/admin/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin });
        })

        app.get('/review', async (req, res) => {
            const query = {};
            const cursor = reviewCollection.find(query)
            const review = await cursor.toArray();
            res.send(review);
        })

        app.get('/orders', async (req, res) => {
            const query = {}
            const orders = await orderCollection.find(query).toArray();
            res.send(orders)
        })

        app.get('/order', verifyToken, async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const queryOrders = await orderCollection.find(query).toArray();
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

        app.delete('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const result = await userCollection.deleteOne(filter)
            res.send(result);
        })

    } finally {
        //   await client.close();
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`Example Electro Manufacturing listening on port ${port}`)
})