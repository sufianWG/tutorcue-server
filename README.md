# TutorCue Server

This is the backend server for **TutorCue**, a tutor discovery and session scheduling web application.

The server is built with **Node.js, Express.js, and MongoDB**. It provides APIs for tutor data, tutor search and filtering, pagination, tutor details, and weekly tutor slot storage.

## Project Links

- Frontend Repository: [https://github.com/sufianWG/tutorcue](https://github.com/sufianWG/tutorcue)
- Backend Repository: [https://github.com/sufianWG/tutorcue-server](https://github.com/sufianWG/tutorcue-server)

## Technologies Used

- Node.js
- Express.js
- MongoDB
- MongoDB Node.js Driver
- CORS
- dotenv

## Current Features

The server currently supports:

- Fetching all tutors from MongoDB
- Fetching a single tutor by MongoDB document ID
- Searching tutors
- Filtering tutors by different fields
- Sorting tutors by newest and oldest
- Server-side pagination
- Storing generated weekly tutor slots
- Checking existing tutor slot data before inserting
- Preventing duplicate slot data for the same tutor and day
- Returning pagination information with tutor results

## API Endpoints

### Root Route

```http
GET /
```

Used to check whether the server is running.

Example response:

```text
Hello World from express server!
```

---

### Get All Tutors

```http
GET /tutors
```

Returns tutor data from the `tutors` collection.

This endpoint also supports search, filtering, sorting, and pagination.

### Query Parameters

```text
page
limit
search
subject
teachingMode
institution
location
sort
```

Example:

```text
/tutors?page=1&limit=9
```

Search example:

```text
/tutors?search=mathematics
```

Filter example:

```text
/tutors?subject=physics&teachingMode=online
```

Location example:

```text
/tutors?location=chattogram
```

Sorting example:

```text
/tutors?sort=oldest
```

The default sorting order is newest first.

### Search Fields

The general search can match:

- Tutor name
- Subject
- Teaching mode
- Institution
- Location

MongoDB regular expressions are used with case-insensitive matching.

Example pagination response structure:

```js
{
  tutors: [],
  pagination: {
    currentPage: 1,
    limit: 9,
    totalTutors: 15,
    totalPages: 2,
    nextPageStatus: true,
    previousPageStatus: false
  }
}
```

---

### Get Single Tutor

```http
GET /tutors/:id
```

Returns a single tutor using the tutor's MongoDB `_id`.

Example:

```text
/tutors/68a1234567890abcdef1234
```

If the tutor is not found, the server returns:

```js
{
  message: "Tutor not found"
}
```

---

### Store Tutor Slots

```http
POST /tutorslots
```

This endpoint stores generated weekly tutor slot data in the `tutorsSlots` collection.

The frontend generates weekly slot information based on the tutor's:

- Available days
- Available start time
- Available end time
- Current week's dates

The server receives separate slot data for the tutor's available days.

Example structure:

```js
[
  {
    tutorId: "tutor-id",
    tutorName: "Tutor Name",
    dayFull: "Tuesday",
    dayShort: "Tue",
    dateNumber: 1,
    month: "Sep",
    year: 2026,
    totalSlots: 6,
    availableSlots: 6,
    slots: [
      {
        start: "18:30",
        end: "19:00",
        status: "available",
        bookedBy: null
      }
    ]
  }
]
```

Before inserting a day's data, the server checks whether matching slot information already exists.

The check currently uses tutor and date-related information such as:

```text
tutorId
tutorName
dayFull
dateNumber
month
year
```

If the slot data does not exist, it is inserted into MongoDB.

If all received slot data already exists, the server returns a normal response instead of inserting the same information again.

Example:

```js
{
  message: "this slot already in the collection"
}
```

This duplicate check is useful because the Tutor Details page may request slot storage again when the page is visited or reloaded.

## MongoDB Collections

The server currently works mainly with these collections:

### `tutors`

Stores tutor information such as:

- Tutor name
- Subject
- Institution
- Location
- Teaching mode
- Available days
- Available time range
- Tutor-related information

### `tutorsSlots`

Stores date-based weekly slot information for tutors.

Each available day can contain:

- Tutor ID
- Tutor name
- Full day name
- Short day name
- Date
- Month
- Year
- Total slots
- Available slots
- Individual session slots

Individual slots currently support fields such as:

```js
{
  start: "18:30",
  end: "19:00",
  status: "available",
  bookedBy: null
}
```

## Pagination

Pagination is handled on the server.

The default page is:

```text
1
```

The default limit is:

```text
9
```

The maximum allowed limit is:

```text
30
```

The API also returns:

```text
currentPage
limit
totalTutors
totalPages
nextPageStatus
previousPageStatus
```

This information is used by the frontend pagination component.

## Search and Filtering

Tutor search is handled with MongoDB queries.

A general search uses `$or` to match multiple fields, while individual filters can be applied for:

```text
subject
teachingMode
institution
location
```

Case-insensitive MongoDB regular expressions are used for matching.

## Environment Variables

Create a `.env` file in the root directory.

Add your MongoDB connection string:

```env
MONGODB_URI=your_mongodb_connection_string
```

You can also provide a custom port:

```env
PORT=6028
```

Do not commit the `.env` file to GitHub.

## Run Locally

Clone the repository:

```bash
git clone https://github.com/sufianWG/tutorcue-server.git
```

Move into the project folder:

```bash
cd tutorcue-server
```

Install dependencies:

```bash
npm install
```

Create the `.env` file and add the required environment variables.

Then run:

```bash
npm run dev
```

The local server uses port `6028` by default if another port is not provided.

Example:

```text
http://localhost:6028
```

## Frontend Connection

The TutorCue frontend communicates with this API.

Frontend environment variable example:

```env
NEXT_PUBLIC_TUTORCUE_SERVER_URL=https://tutorcue-server.vercel.app
```

The frontend repository is available here:

[https://github.com/sufianWG/tutorcue](https://github.com/sufianWG/tutorcue)

## Work in Progress

The backend is still being developed. Some of the next main features are:

- BetterAuth integration
- User session verification
- Authentication-protected APIs
- Add Tutor API
- Update Tutor API
- Delete Tutor API
- Complete booking API
- User-based session booking
- Updating individual slot status after booking
- Decreasing available slots after a successful booking
- Restoring available slots after cancellation
- Booking collection
- My Booked Sessions API
- User-specific tutor management
- Booking status management
- Digital session token generation
- JWT-based API protection where required

## Current Development Status

At the current stage, the backend can fetch tutor data, handle tutor search and filtering, manage pagination, return individual tutor details, and store weekly tutor slot information in MongoDB.

The next main step is connecting authentication with the slot system so that logged-in users can book available tutor sessions and the server can update slot availability based on those bookings.

## Author

**Md. Abu Sufian**

- GitHub: [https://github.com/sufianWG](https://github.com/sufianWG)
- Portfolio: [https://myportfolio-frontend-five.vercel.app/](https://myportfolio-frontend-five.vercel.app/)