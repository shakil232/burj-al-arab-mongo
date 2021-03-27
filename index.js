const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const admin = require('firebase-admin');
require('dotenv').config()

// firebaseTokendoc
const serviceAccount = require(".//configs/burj-al-arab-mongo-12ec0-firebase-adminsdk-ati4q-856222b2aa.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// mongodbConnnectStrin
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9cu5v.mongodb.net/burjhotel?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const app = express();
app.use(cors());
app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }))

client.connect(err => {
    const collection = client.db("burjhotel").collection("roombook");
    app.post('/addBooking', (req, res) => {
        const NewBooking = req.body;
        collection.insertOne(NewBooking)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })

    app.get('/booking', (req, res) => {
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            // idToken comes from the client app
            admin
                .auth()
                .verifyIdToken(idToken)
                .then(decodedToken => {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email;
                    if (tokenEmail == queryEmail) {
                        collection.find({ email: queryEmail })
                            .toArray((err, document) => {
                                res.send(document)
                            })
                    }
                    else {
                        res.status(401).send('un-authorized access')
                    }

                })
                .catch((error) => {
                    res.status(401).send('un-authorized access')
                });
        }
        else {
            res.status(401).send('un-authorized access')
        }
    })
});

app.listen(5000)