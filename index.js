const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require('express');
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const generateSessionPassCode = require("./utils/generateSessionPassCode");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
const { MongoClient, ObjectId } = require("mongodb");
const app = express()
const port = process.env.PORT || 6028;

app.use(cors());
app.use(express.json());

const JWKS = createRemoteJWKSet(
    new URL(`${process.env.FRONTEND_URL}/api/auth/jwks`)
)

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).send({
            message: "Unauthorized access"
        });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).send({
            message: "Unauthorized access"
        });
    }
    console.log(token);
    try {
        const { payload } = await jwtVerify(token, JWKS);
        console.log(payload);
        next()
    } catch (error) {
        return res.status(403).json({
            message: "Forbidedn"
        });
    }

}

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
                    $regex: searchBySub,
                    $options: "i"
                }
            }
            if (searchByTeachingMode) {
                searchQuery.teachingMode = {
                    $regex: searchByTeachingMode,
                    $options: "i"
                }
            }
            if (searchByInstitute) {
                searchQuery.institution = {
                    $regex: searchByInstitute,
                    $options: "i"
                }
            }
            if (searchByLocation) {
                searchQuery.location = {
                    $regex: searchByLocation,
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

        app.get("/tutors/:id", verifyToken,  async (req, res) => {
            const { id } = req.params;
            const db = client.db("tutorcue");
            const tutor = await db.collection("tutors").findOne({ _id: new ObjectId(id) });
            if (!tutor) {
                return res.status(404).json({ message: "Tutor not found" });
            }
            res.send(tutor);
        });

        app.post("/tutorslots", verifyToken, async (req, res) => {
            const db = client.db("tutorcue");
            const tutorsSlotsCollection = db.collection("tutorsSlots");
            const slotsData = req.body
            let insertedCount = 0;
            for (const slotDay of slotsData) {
                const existingDay = await tutorsSlotsCollection.findOne({
                    tutorId: slotDay.tutorId,
                    tutorName: slotDay.tutorName,
                    dateNumber: slotDay.dateNumber,
                    dayFull: slotDay.dayFull,
                    month: slotDay.month,
                    year: slotDay.year
                })
                if (!existingDay) {
                    await tutorsSlotsCollection.insertOne(slotDay)
                    insertedCount++
                }
            }
            if (insertedCount === 0) {
                return res.status(200).send({
                    message: "this slot already in the collection"
                })
            }
            return res.status(201).send({
                message: "slots data stored successfully"
            })
        })
        app.post("/booking", verifyToken, async (req, res) => {
            const db = client.db("tutorcue");
            const bookingCollection = db.collection("booking");
            const tutorSlotCollection = db.collection("tutorsSlots");
            const bookingData = req.body
            console.log("bookingData:", bookingData);

            //  check korbe ei slot already booked kina
            const existingBooking = await bookingCollection.findOne({
                tutorId: bookingData.tutorId,
                dateNumber: bookingData.dateNumber,
                month: bookingData.month,
                year: bookingData.year,
                "sessionTime.start": bookingData.sessionTime.start,
                "sessionTime.end": bookingData.sessionTime.end,
                status: "booked"
            })
            console.log("existingBooking", existingBooking);
            if (existingBooking) {
                return res.status(409).send({
                    success: false,
                    message: "This slot has already been booked"
                })
            }

            // jodi slot available thake tahole update korbe status to booked and bookedBy studentEmail
            const slotUpdateResult = await tutorSlotCollection.updateOne(
                {
                    tutorId: bookingData.tutorId,
                    dateNumber: bookingData.dateNumber,
                    month: bookingData.month,
                    year: bookingData.year,
                    slots: {
                        $elemMatch: {
                            start: bookingData.sessionTime.start,
                            end: bookingData.sessionTime.end,
                            status: "available"
                        }
                    }
                },
                {
                    $set: {
                        "slots.$.status": "booked",
                        "slots.$.bookedBy": bookingData.studentEmail,
                    },
                    $inc: {
                        availableSlots: -1,
                    }
                }
            );
            // console.log("slotUpdateResult:", slotUpdateResult);

            // check korbe jodi modifiedCount 0 hoy tahole mane ei slot already booked or available na
            if (slotUpdateResult.modifiedCount === 0) {
                return res.status(409).send({
                    success: false,
                    message: "This slot has already been booked or is not available"
                })
            }

            // booking data insert korbe booking collection e with sessionPassCode and status booked
            const sessionPassCode = generateSessionPassCode();
            // console.log("sessionPassCode:", sessionPassCode);
            const newBooking = {
                ...bookingData,
                sessionPassCode,
                status: "booked",
                createdAt: new Date(),
                updatedAt: new Date()
            }
            console.log("newBooking", newBooking);

            const result = await bookingCollection.insertOne(newBooking);
            if (!result.acknowledged) {
                return res.status(500).send({
                    success: false,
                    message: "Failed to book session"
                })
            }
            res.status(201).send({
                success: true,
                message: "Session booked successfully",
                sessionPassCode
            });
        })

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