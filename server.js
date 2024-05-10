const express = require("express");
const cors = require("cors");
const User = require("./models/db")
const bodyParser = require("body-parser");
const multer = require("multer")
const path = require("path");
const postrequest = require("./models/postreqdb")
const app = express();

app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use("/files", express.static(path.join(__dirname, "files")));
// Body parser middleware
app.get("/",cors(),(req,res)=>{
    res.send("hello")
})

//Database connection--------------------------------------
const mongoose = require("mongoose");
const user = require("./models/db");

mongoose
  .connect(
    "mongodb+srv://mallulavenky766:r7JxfiwjUpF4WKX6@cluster0.642vucw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => {
    console.log("conected to database");
  })
  .catch((e) => {
    console.log(e.message);
  });

//multer setup----------------------------------------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./files");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Post request route
app.post("/postrequest", upload.single("priceQuotation"), async (req, res) => {
  const {
    requestDetails,
    quantity,
    category,
    price,
    requester,
    approver,
    observer,
  } = req.body;
  const priceQuotation = req.file; // Use req.file since it's a single file upload
  const pdfName = priceQuotation ? req.file.filename : "no file";

  try {
    const check = await postrequest.findOne({ description: requestDetails });
    if (!check) {
      await postrequest.create({
        description: requestDetails,
        priceQuotation: pdfName,
        quantity: quantity,
        category: category,
        price: price,
        requester: requester,
        Approver: approver,
        Approver1: approver,
        observer: observer,
      });

      // Send response if needed
      res.status(200).json({ message: "Request posted successfully" });
    } else {
      res.json("Request already exists");
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
//pdf viewer---------------------------------------------------
// Serve files from the 'files' directory


// Route to serve the file
app.get("/files/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, "files", filename);
  
  // Set the appropriate Content-Type header based on the file extension
  const contentType = getContentType(filename);
  res.setHeader("Content-Type", contentType);
  
  // Send the file
  res.sendFile(filePath);
});

// Helper function to determine Content-Type based on file extension
function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case ".pdf":
      return "application/pdf";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    // Add more cases for other file types as needed
    default:
      return "application/octet-stream"; // Default to binary data
  }
}
// Route to get request details by ID--------------------------------------
app.get("/requests/:requestId", async (req, res) => {
  const { requestId } = req.params;

  try {
    const request = await postrequest.findById(requestId); // Assuming you are using Mongoose
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    res.json(request);
  } catch (error) {
    console.error("Error fetching request details:", error);
    res.status(500).json({ message: "Server error" });
  }
});
// Route to fetch all requests
app.get("/allrequests", async (req, res) => {
  try {
    // Retrieve all requests from the database
    const requests = await postrequest.find();
    res.json(requests); // Return the requests as JSON response
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ message: "Error fetching requests" });
  }
});


//user login authenticaton-------------------------------------
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: email.trim() });
    if (user) {
      if (user.password === password) {
        res.json({ exists: true, role: user.role, name: user.name, email: user.email,designation: user.designation }); // Include role in the response
      } else {
        res.json("Incorrect password"); // Password incorrect
      }
    } else {
      res.json("not found"); // User not found
    }
  } catch (e) {
    console.log("Error:", e.message);
    res.status(500).json("internal server error");
  }
});
//Display the requests to the admin----------------------------------------------
// Fetching pending requests in the backend
app.get("/pendingrequests/:username", async (req, res) => {
  const { username } = req.params;
  try {
    // Find all records that match the username in the postrequest collection
    const pendingRequests = await postrequest.find({ Approver: username , status: "pending"});

    res.json(pendingRequests);
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//select options for forward----------------------------------------------
// GET /admins endpoint to fetch admins
app.get("/admins", async (req, res) => {
  try {
    const admins = await User.find({
      role: { $in: ["admin", "Financeteam"] },
    });
    res.json(admins);
  } catch (err) {
    console.error("Error fetching admins:", err);
    res.status(500).json({ error: "Error fetching admins" });
  }
});
//change the forward status ------------------------------------------------
// Update PUT /requests/:id/forward endpoint in the backend
// PUT /requests/:id/forward endpoint to forward request to a new admin
app.put("/requests/:id/forward", async (req, res) => {
  try {
    const requestId = req.params.id;

    // Fetch the existing request record
    const existingRequest = await postrequest.findById(requestId);
    if (!existingRequest) {
      return res.status(404).json({ error: "Request not found" });
    }

    let flagMessage = "";

    // Check if Approver2 is null
    if (!existingRequest.Approver2 && req.body.Approver !== "Finance team") {
      // If Approver2 is null, update Approver2 and Approver fields with the value from the request body
      await postrequest.findByIdAndUpdate(
        requestId,
        { Approver2: req.body.Approver, Approver: req.body.Approver },
        { new: true }
      );
      flagMessage = "Approver2 set successfully";
    } else if (!existingRequest.Approver3 && req.body.Approver !== "Finance team") {
      // If Approver2 is not null and Approver3 is null, update Approver3 with the value from the request body
      await postrequest.findByIdAndUpdate(
        requestId,
        { Approver3: req.body.Approver, Approver: req.body.Approver },
        { new: true }
      );
      flagMessage = "Approver3 set successfully";
    } else if (req.body.Approver === "Finance team") {
      // Check if the Approver is the finance team
      // If Approver2 and Approver3 are not null and the Approver is the finance team, update FinanceApproval directly
      await postrequest.findByIdAndUpdate(
        requestId,
        { FinanceApproval: "Finace team", Approver: "Finance team" }, // Update FinanceApproval to "approved" directly
        { new: true }
      );
      flagMessage = "FinanceApproval set directly by the finance team";
    } else {
      flagMessage = "none";
    }

    // Fetch the updated request record
    const updatedRequest = await postrequest.findById(requestId);

    res.json({ request: updatedRequest, flag: flagMessage });
  } catch (error) {
    console.error("Error forwarding request:", error);
    res.status(500).json({ error: "Error forwarding request" });
  }
});

// Update request status by ID------------------------------------------------
app.put("/requests/:id", async (req, res) => {
  const { id } = req.params;
  const { status, rejected_message } = req.body; // Correctly access status and rejected_message

  try {
    const updatedRequest = await postrequest.findByIdAndUpdate(
      id,
      { status, rejected_message }, // Pass status and rejected_message directly
      { new: true }
    );
    if (!updatedRequest) {
      return res.status(404).json({ message: "Request not found" });
    }
    res.json(updatedRequest);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

//show requests to users------------------------
app.get("/myrequests/:username", async (req, res) => {
  try {
    // Fetch the logged-in user's username from the request params
    const { username } = req.params;
    // Fetch requests where the username matches any of the roles (Approver1, Approver2, Approver3, or observer)
    const myRequests = await postrequest.find({
      $or: [
        { Approver1: username },
        { Approver2: username },
        { Approver3: username },
        { observer: username},
        { requester: username},
      ],
    });

    if (!myRequests || myRequests.length === 0) {
      return res
        .status(404)
        .json({ message: "No requests found for this user" });
    }
    res.json(myRequests);
  } catch (e) {
    console.error("Error fetching requests:", e);
    res.status(500).json({ message: "Internal server error" });
  }
});


//Add user--------------------------------------
app.post("/adduser", async (req, res) => {
  const { fullName, email, password, role,employeeId,mobileNumber,location,designation } = req.body;
  // Further processing or database operations can be performed here
  try {
    const check = await User.findOne({ email: email });
    if (!check) {
      await User.create({
        name: fullName,
        email: email,
        password: password,
        role: role,
        employee_id: employeeId,
        mobile_number: mobileNumber,
        location: location,
        designation : designation
      });

      // Send response if needed
      res.status(200).json({ message: "Request posted successfully" });
    } else {
      res.json("Request already exist");
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
// GET user by email--------------------------------------------
app.get("/user/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
// Endpoint to get all users---------------------------------------------
app.get("/users", async (req, res) => {
  try {
    // Fetch all users from the database
    const users = await User.find();
    res.status(200).json(users); // Send the users data as JSON response
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" }); // Send error response
  }
});
// Route to update user by ID
app.put("/user/:id", async (req, res) => {
  const { id } = req.params;
  const {
    name,
    email,
    password,
    role,
    employee_id,
    mobile_number,
    location,
    designation
  } = req.body;
  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        name,
        email,
        password,
        role,
        employee_id,
        mobile_number,
        location,
        designation
      },
      { new: true }
    );
    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Error updating user" });
  }
});


// Route to update user details by email---------------------------------------
app.put('/user/:email', async (req, res) => {
  const { email } = req.params;
  const userData = req.body;
  try {
    const user = await User.findOneAndUpdate({ email }, userData, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User details updated successfully', user });
  } catch (error) {
    console.error('Error updating user data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
const port = 5000

app.listen(port, () => {
  console.log(`server is running on ${port}`);
});

