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
        // await client.connect();


        app.get("/tutors", async (req, res) => {
            const db = client.db("tutorcue");
            const tutorsCollection = db.collection("tutors");

            const requestedPage = req.query.page
            const requestedLimit = req.query.limit

            const search = req.query.search || ""
            const searchBySub = req.query.subject || ""
            const searchByTeachingMode = req.query.teachingMode || ""
            const searchByInstitute = req.query.institution || ""
            const searchByLocation = req.query.location || ""

            // console.log(search);
            const searchQuery = {}
            if (search) {
                searchQuery.$or = [
                    {
                        tutorName: {
                            $regex: search,
                            $options: "i"
                        }
                    },
                    {
                        subject: {
                            $regex: search,
                            $options: "i"
                        }
                    },
                    {
                        teachingMode: {
                            $regex: search,
                            $options: "i"
                        }
                    },
                    {
                        institution: {
                            $regex: search,
                            $options: "i"
                        }
                    },
                    {
                        location: {
                            $regex: search,
                            $options: "i"
                        }
                    }

                ]
            }

            if (searchBySub) {
                searchQuery.subject = {
                    $regex : searchBySub,
                    $options: "i"
                }
            }
            if (searchByTeachingMode) {
                searchQuery.teachingMode = {
                    $regex : searchByTeachingMode,
                    $options: "i"
                }
            }
            if (searchByInstitute) {
                searchQuery.institution = {
                    $regex : searchByInstitute,
                    $options: "i"
                }
            }
            if (searchByLocation) {
                searchQuery.location = {
                    $regex : searchByLocation,
                    $options: "i"
                }
            }

            const page = Math.max(parseInt(requestedPage) || 1, 1);
            // console.log(page);

            const limit = Math.min(Math.max(parseInt(requestedLimit) || 9, 1), 30);
            // console.log(limit);
            const skip = (page - 1) * limit

            const sort = req.query.sort
            let sortQuery = { createdAt: -1 };
            if (sort == "oldest") {
                sortQuery = { createdAt: 1 };
            }
            // console.log(sort);

            const totalTutors = await tutorsCollection.countDocuments(searchQuery);
            // console.log(totalTutors);
            const totalPages = Math.ceil(totalTutors / limit);
            // console.log(totalPages);

            const tutors = await tutorsCollection.find(searchQuery).sort(sortQuery).skip(skip).limit(limit).toArray();
            // console.log(tutors);
            res.send({
                tutors,
                pagination: {
                    currentPage: page,
                    limit,
                    totalTutors,
                    totalPages,
                    nextPageStatus: page < totalPages,
                    previousPageStatus: page > 1
                }
            });
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

//  have to remove comment out
module.exports = app;

// app.listen(port, () => {
//     console.log(`Server running at http://localhost:${port}`)
// })