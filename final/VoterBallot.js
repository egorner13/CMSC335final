const path = require("path");
const http = require('http');
const express = require("express");  
let bodyParser = require("body-parser");
const app = express();
const fs = require("fs");
const prompt = "Stop to shutdown the server: ";
let fileContent;
const portNumber = process.argv[2] || 4001;
const args = process.argv.slice(2);
process.stdin.setEncoding("utf8");
let file = args[0];
const { MongoClient, ServerApiVersion } = require('mongodb');

require("dotenv").config({ path: path.resolve(__dirname, 'credentialsDontPost/.env') })  

const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;

console.log(`Web server started and running at http://localhost:${portNumber}`);
http.createServer(app).listen(portNumber);

const databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection: process.env.MONGO_COLLECTION};

async function main() {
    const uri = `mongodb+srv://${userName}:${password}@cluster0.he93e9e.mongodb.net/?retryWrites=true&w=majority`;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 }); 

    process.stdout.write(prompt);

    process.stdin.on("readable", function () {
        let dataInput = process.stdin.read();
        if (dataInput !== null) {
        let command = dataInput.trim();
        console.log(command)
          if (command === "stop") {
            process.stdout.write("Shutting down the server\n");
            process.exit(0);
          }
          process.stdin.resume();
        }
      });

/*       try {
        await client.connect();
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    } */
}

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:false}));

app.get("/", (request, response) => {
    response.render("index");
});

app.get("/ballot", (request, response) => { 
  response.render("ballot");
});

app.post("/ballotConfirmation", (request, response) => {
  const variables = {
    name:request.body.name,
    party:request.body.party,
    state:request.body.state,
    age:Number(request.body.age),
    
  }
  const uri = `mongodb+srv://${userName}:${password}@cluster0.he93e9e.mongodb.net/?retryWrites=true&w=majority`;
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 }); 
  
  client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(variables);
  response.render("ballotConfirmation", variables);
});



app.get("/count", (request, response) => {
  response.render("count");
});

app.post("/count", async(request, response) => {
  let partyGiven = request.body.party;
  let result;
  let table = "<table border = '1'><tr> <th>Name</th> <th>Age</th></tr>";
   const uri = `mongodb+srv://${userName}:${password}@cluster0.he93e9e.mongodb.net/?retryWrites=true&w=majority`;
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 }); 

   try {
      await client.connect(); 
          result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).find({ party: {$eq : partyGiven }}).toArray();
          //console.log(result);
          for (let i = 0; i < result.length; i++) {
              const voter = result[i];
              
              table += `<tr><td>${voter.name}</td><td>${voter.age}</td></tr>`;
          }           
         
          table+= "</table>";
          response.render("ballotList", {ballotTable:table});
  } catch (e) {
      console.error(e);
  } finally {
      await client.close();
  } 
});

app.get("/reset", (request, response) => {
  const vars = {
    url: `http://localhost:${portNumber}/resetConfirmation`
  }

  response.render("reset");
});

app.post("/reset", async(request, response) => {
   const uri = `mongodb+srv://${userName}:${password}@cluster0.he93e9e.mongodb.net/?retryWrites=true&w=majority`;
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 }); 
  
 try {
         await client.connect(); 
        let docs = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).countDocuments();
         await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).deleteMany();


         const variables = {
          deletedDocs:docs
         }
        response.render("afterReset", variables);
      
          
         
   } catch (e) {
      console.error(e);
  } finally {
      await client.close();
  } 
});

app.get("/result", (request, response) => {
  response.render("result");
});

main().catch(console.error);