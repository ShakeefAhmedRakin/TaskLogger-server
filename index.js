const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.iixzvov.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    // LOADING COLLECTIONS
    const taskCollection = client.db("TaskLogger").collection("taskCollection");

    // ++TASK POST API++
    app.post("/tasks", async (req, res) => {
      const taskInfo = req.body;
      const result = await taskCollection.insertOne(taskInfo);
      console.log("getting data");
      res.send(result);
    });

    // ++TASK GET ALL PER USER API++
    app.get("/tasks/user", async (req, res) => {
      const userEmail = req.query.email;

      try {
        const tasks = await taskCollection.find({ email: userEmail }).toArray();
        res.send(tasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).send("Error fetching tasks");
      }
    });

    // ++TASK DELETE API++
    app.delete("/tasks/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await taskCollection.deleteOne(query);
      res.send(result);
    });

    // ++TASK GET SINGLE API++
    app.get("/tasks/:id", async (req, res) => {
      try {
        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
          res.status(400).send({ error: "Invalid product ID" });
          return;
        }

        const query = { _id: new ObjectId(id) };
        const result = await taskCollection.findOne(query);

        if (!result) {
          res.status(404).send({ error: "Product not found" });
          return;
        }

        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Internal server error" });
      }
    });

    // ++TASK STATUS UPDATE++
    app.patch("/tasks/status/:id/:status", async (req, res) => {
      const id = req.params.id;
      const status = req.params.status;

      const query = {
        _id: new ObjectId(id),
      };

      const updatedTask = {
        $set: {
          status: status,
        },
      };

      const result = await taskCollection.updateOne(query, updatedTask);
      res.send(result);
    });

    // ++TASK UPDATE DETAILS API++
    app.put("/tasks/update/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const details = {
        $set: {
          title: req.body.title,
          description: req.body.description,
          deadline: req.body.deadline,
          priority: req.body.priority,
        },
      };

      const result = await taskCollection.updateOne(query, details, options);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(port, () => {
  console.log("Server listening on port", port);
});
