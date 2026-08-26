const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require('express');
const dotenv = require("dotenv");
dotenv.config();
const { MongoClient, ObjectId } = require("mongodb");
const app = express()
const port = process.env.PORT || 6028;

app.use(express.json());


const client = new MongoClient(process.env.MONGODB_URI);
async function connectToMongoDB() {
    try {
        await client.connect();
        
        app.get("/tutors", async (req, res) => {
            const db = client.db("tutorcue");
            const tutorsCollection = db.collection("tutors");
            const tutors = await tutorsCollection.find().toArray();
            // console.log(tutors);
            res.send(tutors);
        });

        app.get("/tutors/:id", async (req, res) => {
            const { id } = req.params;
            const db = client.db("tutorcue");
            const tutor = await db.collection("tutors").findOne({ _id: new ObjectId(id) });
            if (!tutor) {
                return res.status(404).json({ message: "Tutor not found" });
            }
            res.send(tutor);
        });

        // console.log("You successfully connected to MongoDB!");
        return client;
    } catch (err) {
        console.dir(err);
    }
}

connectToMongoDB()

app.get('/', (req, res) => {
    res.send('Hello World from express server!')
})

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
})