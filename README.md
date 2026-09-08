# TutorCue Server

This is the backend server for **TutorCue**, a tutor discovery and session booking web application.

The server is built with **Node.js, Express.js, and MongoDB**. It provides APIs for tutor data (browse, add, update, delete), weekly tutor slot management, session booking (book and cancel), and JWT-protected private routes.

## Project Links

- Frontend Repository: [https://github.com/sufianWG/tutorcue](https://github.com/sufianWG/tutorcue)
- Backend Repository: [https://github.com/sufianWG/tutorcue-server](https://github.com/sufianWG/tutorcue-server)
- Live API: [https://tutorcue-server.vercel.app/](https://tutorcue-server.vercel.app/)
- Live Frontend: [https://tutorcue.vercel.app/](https://tutorcue.vercel.app/)

## Technologies Used

- Node.js
- Express.js
- MongoDB
- MongoDB Node.js Driver
- CORS
- dotenv
- jose (verifies JWTs issued by the frontend's BetterAuth instance via its JWKS endpoint)

## Current Features

The server currently supports:

- Fetching all tutors from MongoDB, with search, filtering, sorting, and pagination
- Fetching a single tutor by MongoDB document ID
- Adding, updating, and deleting a tutor (ownership-checked — a user can only update/delete tutors they created)
- Listing the tutors created by the logged-in user
- Automatically generating and storing a tutor's weekly time slots (current and next week)
- Booking an available slot, with a generated session pass code
- Listing the logged-in user's own bookings
- Cancelling a booking and restoring the slot it used
- Verifying a JWT (issued by the frontend) on every private route

## Authentication

The frontend issues a JWT using BetterAuth after a user logs in (email/password or Google). Every private request from the frontend sends this token in the `Authorization` header:

```text
Authorization: Bearer <token>
```

The `verifyToken` middleware verifies the token against the frontend's JWKS endpoint (`<FRONTEND_URL>/api/auth/jwks`) before allowing the request through. Routes that don't need a logged-in user (like `GET /tutors`) skip this middleware; routes that create, modify, or read a user's own data all require it.

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

Returns tutor data from the `tutors` collection, each with its current week's available slot count attached.

This endpoint also supports search, filtering, sorting, and pagination, and does not require authentication.

#### Query Parameters

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

The default sorting order is newest first. Multi-word filter values (e.g. a dropdown value like `computer-science`) are normalized to spaces before matching, so both the exact wording and casing of the stored value don't need to match exactly — matching is case-insensitive.

#### Search Fields

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

Returns a single tutor using the tutor's MongoDB `_id`. Requires authentication.

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

### Add Tutor

```http
POST /tutors
```

Requires authentication. Creates a new tutor document, attaching `createdBy` (name and email) from the logged-in user's token, plus `createdAt`/`updatedAt` timestamps.

Example response:

```js
{
  success: true,
  message: "Tutor added successfully",
  tutorId: "68a1234567890abcdef1234"
}
```

---

### Update Tutor

```http
PATCH /tutors/:id
```

Requires authentication. Updates a tutor, but only if the logged-in user is the one who created it. System-managed fields (`_id`, `createdBy`, `createdAt`) can't be overwritten by the request body.

If the tutor doesn't exist or isn't owned by the requester:

```js
{
  success: false,
  message: "Tutor not found or you are not the owner"
}
```

---

### Delete Tutor

```http
DELETE /tutors/:id
```

Requires authentication. Deletes a tutor, but only if the logged-in user is the one who created it.

---

### Get My Tutors

```http
GET /my-tutors
```

Requires authentication. Returns all tutors created by the logged-in user, newest first.

---

### Get Tutor Slots

```http
GET /tutorslots/:tutorId
```

Requires authentication. Returns a single tutor's available slots for the current and next week.

If slot documents for those weeks don't exist yet, the server generates them automatically from the tutor's `availableDays`, `availableTimeSlot`, and `sessionStartDate` before returning them — the frontend never has to compute or send slot data itself. A unique index on `(tutorId, dateNumber, month, year)` and duplicate-key handling on insert make this safe to call repeatedly (for example, every time the Tutor Details page loads) without ever creating duplicate slot documents.

Example slot structure:

```js
{
  start: "18:30",
  end: "19:00",
  status: "available",
  bookedBy: null
}
```

---

### Book a Session

```http
POST /booking
```

Requires authentication. Books a specific date and time slot for a tutor if it's still available, marks that slot as `booked` in `tutorsSlots`, decrements `availableSlots`, and inserts a new document into the `booking` collection with a generated `sessionPassCode`.

If the slot is already booked:

```js
{
  success: false,
  message: "This slot has already been booked"
}
```

Example success response:

```js
{
  success: true,
  message: "Session booked successfully",
  sessionPassCode: "TC-XXXXXXXX"
}
```

---

### Get My Bookings

```http
GET /my-bookings
```

Requires authentication. Returns all bookings made by the logged-in user, newest first.

---

### Cancel a Booking

```http
PATCH /bookings/:id/cancel
```

Requires authentication. Cancels a booking owned by the logged-in user, sets its status to `cancelled`, and restores the slot it used back to `available` in `tutorsSlots`.

If the booking doesn't exist, isn't owned by the requester, or is already cancelled, the server returns an error response instead of cancelling it again.

## MongoDB Collections

The server works with these collections:

### `tutors`

Stores tutor information such as:

- Tutor name, photo, subject, bio, and about text
- Institution, location, and teaching mode
- Hourly fee, experience, and total slot
- Available days and available time range
- Session start date
- `createdBy` (name and email of the user who added the tutor)

### `tutorsSlots`

Stores date-based weekly slot information for tutors.

Each available day can contain:

- Tutor ID and tutor name
- Full day name and short day name
- Date, month, and year
- Total slots and available slots
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

### `booking`

Stores each booked session, including the student's info, a snapshot of the tutor's info at booking time, the session's date/time/mode, a generated `sessionPassCode`, and a `status` (`booked` or `cancelled`).

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

Case-insensitive MongoDB regular expressions are used for matching, and hyphenated multi-word filter values are normalized to spaces before matching.

## Environment Variables

Create a `.env` file in the root directory.

Add your MongoDB connection string:

```env
MONGODB_URI=your_mongodb_connection_string
```

Add the deployed frontend URL, used to verify JWTs against the frontend's JWKS endpoint:

```env
FRONTEND_URL=your_deployed_frontend_url
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

## Project Status

The backend is complete. Tutor browsing/search/filtering/pagination, tutor CRUD with ownership checks, automatic weekly slot generation, session booking, and booking cancellation with slot restoration are all implemented and JWT-protected where needed.

## Author

**Md. Abu Sufian**

- GitHub: [https://github.com/sufianWG](https://github.com/sufianWG)
- Portfolio: [https://myportfolio-frontend-five.vercel.app/](https://myportfolio-frontend-five.vercel.app/)
