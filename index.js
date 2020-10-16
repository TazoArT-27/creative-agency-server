const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs-extra');
const fileUpload = require('express-fileupload');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qjf3c.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;




const app = express()

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('reviews'));
app.use(express.static('servicess'));
app.use(fileUpload());

const port = 5000;

app.get('/', (req, res) => {
    res.send("db it's working working")
})


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true});
client.connect(err => {
  const projectsCollection = client.db("creativeAgency").collection("allProjects");
  const feedCollection = client.db("creativeAgency").collection("feeds");
  const serviceCollection = client.db("creativeAgency").collection("serviceCollection");
  const adminCollection = client.db("creativeAgency").collection("admin");


  //admin********************************************************************************

  app.post("/makeAdmin", (req, res) => {
    const email = req.body.email;
    console.log(email)
    adminCollection.insertOne( {email} )
        .then(result => {
            res.send(result.insertedCount > 0)
        })
  })

  app.post('/addAService', (req, res) => {
    const file = req.files.file;
    const title = req.body.title;
    const description = req.body.description;
    const filePath = `${__dirname}/servicess/${file.name}`;
    console.log(title, description, file);
    file.mv(filePath, err => {
        if(err){
            console.log(err);
            return res.status(500).send({msg: "Failed to upload image"})
        }
        return res.send({name: file.name, path:`/${file.name}`})
    })
    
    const newImg = fs.readFileSync(filePath);
    const encImg = newImg.toString('base64');

    var image = {
      contentType: req.files.file.mimetype,
      size: req.files.file.size,
      img: Buffer(encImg, 'base64')
    }

    serviceCollection.insertOne({image, title, description})
    .then(result => {
      fs.remove(filePath, error => {
        if (error){
          res.status(500).send({msg: "Failed to upload image"})
          console.log(error)
        }
        res.send(result.insertedCount > 0);
      })
  })
  })
  app.get("/allProjects", (req, res) => {
    const email = req.body.email;
      projectsCollection.find({})
      .toArray((err, documents) => {
          res.send(documents);
      })
  })

  //client***************************************************************************


  app.post("/addProjects", (req, res) => {
      const project = req.body;
      //console.log(project);
    //  const email = req.body.email;
      projectsCollection.insertOne(project)
      .then(result => {
          res.send(result.insertedCount > 0);
      })
  })

  app.post("/projectByDate", (req, res) => {
    const date = req.body;
    console.log(date.date);
    const email = req.body.email;
    adminCollection.find({email: email})
    .toArray((err, admins) => {
      const filter = {date: date.date}
      // res.send(documents);
      if(admins.length === 0 ){
        filter.email = email;
      }

      projectsCollection.find(filter)
    .toArray((err, documents) => {
      res.send(documents);
    })
    })
    
    
})


  app.get("/servicess", (req, res) => {
    serviceCollection.find({}).limit(4)
    .toArray((err, docs) => {
        res.send(docs);
    });
  });

  app.get("/home/services", (req, res) => {
    serviceCollection.find({}).toArray((err, docs) => {
        res.send(docs);
    });
  });
  
  app.get("/serviceList", (req, res) => {
    projectsCollection.find({ email: req.query.email }).toArray((error, documents) => {
        res.send(documents);
        console.log(error);
    });
  })

  //userorderlist******************************************************************************
//   app.get('/showAllUserOrder', (req, res) => {
//     orderCollection.find({ userEmail: req.query.email })
//         .toArray((err, document) => {
//             res.status(200).send(document)
//         })
// })



  //review****************************************************************************************
  app.post('/addAReview', (req, res) => {
    const file = req.files.file;
    const name = req.body.name;
    const designation = req.body.designation;
    const description = req.body.description;
    const reviewFilePath = `${__dirname}/reviews/${file.name}`;
    //console.log(name, designation, description, file)
    file.mv(reviewFilePath, err => {
        if(err){
            console.log(err);
            return res.status(500).send({msg: "Failed to upload image"})
        }
        return res.send({name: file.name, path:`/${file.name}`})
    })

    const newReviewImg = fs.readFileSync(reviewFilePath);
    const encReviewImg = newReviewImg.toString('base64');

    var image = {
      contentType: req.files.file.mimetype,
      size: req.files.file.size,
      img: Buffer(encReviewImg, 'base64')
    }

    feedCollection.insertOne({image, name, designation, description})
    .then(result => {
      fs.remove(reviewFilePath, error => {
        if (error){
          res.status(500).send({msg: "Failed to upload image"})
          console.log(error)
        }
      res.send(result.insertedCount > 0);
  })
})
  })
app.get('/feeds', (req, res) => {
  feedCollection.find({}).limit(4)
      .toArray((err, documents) => {
          res.send(documents);
   })
});

app.post("/isAdmin", (req, res) => {
  const email = req.body.email;
  adminCollection.find({email: email})
  .toArray((err, admins) => {
     res.send(admins.length > 0)
  })
  
  
})





});











app.listen(process.env.PORT || port);