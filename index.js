// import the required modules
const express = require('express')
const fetch = require('node-fetch');
const sqlite3 = require('sqlite3').verbose();
var crypto = require('crypto');


// initialize DB
const db = new sqlite3.Database(':memory:');

const app = express()

// set view engine
app.set('view engine', 'ejs')

// parse application/json
app.use(express.json())

const port = 3000

const epiId = <your-epi-id>; // {String} Merchant's unique 4-part key, which is provided after boarding with the processor
const epiKey = <your-epi-key>

app.get('/', (req, res) => {
 res.render('home')
})

// API routes go here

app.listen(port, () => {
 console.log(`Example app listening on port ${port}`)
})

app.post('/signup', async (req, res) => {
    const { FirstName, LastName, Phone, Email, AccountNumber, ExpirationDate, CVV, PlanType, Amount } = req.body.customerDetails
   
    let today = new Date().getFullYear() + '-' +
                String(new Date().getMonth() + 1).padStart(2, '0') + '-' +
                String(new Date().getDate()).padStart(2, '0')
   
    // the payload containing the request data
    const payload = {
      CustomerData: {
        FirstName,
        LastName,
        Phone,
        Email,
      },
      PaymentMethod: {
        CreditCardData: {
          AccountNumber,
          ExpirationDate,
          CVV,
        }
      },
      SubscriptionData: {
        Amount: 29.99,
        Frequency: 'Monthly',
        BillingDate: today,
        Description: 'premium',
        FailureOption: 'Pause'
      }
    }
   
    // convert the payload to JSON
    const payloadJson = JSON.stringify(payload)
   
    // concatenate the API route and the payload
    const concatData = '/subscription' + payloadJson
   
     // generate the ePISignature following the instructions in the "How To Authenticate" section of the Recurring Billing API Integration Guide
   
    console.log('epiSignature', ePISignature);
    console.log('body:', JSON.stringify(payload));

    fetch('https://billing.epxuap.com/subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'EPI-Id': epiId,
        'EPI-Signature': ePISignature,
      },
      body: JSON.stringify(payload)
    })
    .then(res => res.json()) // expecting a json response
    .then(data => {
      console.log(data)
      db.serialize(() => {
        db.run('CREATE TABLE IF NOT EXISTS customerDetails (firstName TEXT, lastName TEXT, phone TEXT, email TEXT, description TEXT, amount TEXT, status TEXT, subscriptionId TEXT)')
   
        const stmt = db.prepare("INSERT INTO customerDetails VALUES (?,?,?,?,?,?,?,?)");
   
        stmt.run(FirstName, LastName, Phone, Email, data.Description, data.Amount, data.Status, data.id)
   
        db.each('SELECT * FROM customerDetails', (err, row) => console.log(row))
      })
      if(data.VerifyResult.Code === '00'){ // check if the transaction was approved. Code '00' is returned on approval
        res.send({
          success: true,
          id: data.id
        })
      }
    });
   })
   
   app.get('/profile', (req, res) => {
    const { id } = req.query
   
    let customer
     db.serialize(() => {
      db.get(`SELECT * FROM customerDetails WHERE subscriptionId = ${id}`, (err, row) => customer = row)
    })
   
    const payload = {SubscriptionID: Number(id)}
   
    // convert the payload to JSON
    const payloadJson = JSON.stringify(payload)
   
    // concatenate the API route and the payload
    const concatData = '/subscription/list' + payloadJson
   
     // generate the ePISignature following the instructions in the "How To Authenticate" section of the Recurring Billing API Integration Guide
   
    fetch('https://billing.epxuap.com/subscription/list', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'EPI-Id': epiId,
        'EPI-Signature': ePISignature,
      },
      body: JSON.stringify(payload)
    })
    .then(res => res.json()) // expecting a json response
    .then(data => {
      console.log(data)
      res.render('profile', {
        customer,
        data
      })
    });
   })

   app.post('/upgrade', (req, res) => {
    const { id, Amount } =  req.body
   
    let customer
     db.serialize(() => {
      db.get(`SELECT * FROM customerDetails WHERE subscriptionId = ${id}`, (err, row) => customer = row)
    })
   
    const payload = {
      SubscriptionID: Number(id),
      SubscriptionData: {
        Amount: 29.99,
        Frequency: 'Monthly',
        FailureOption: 'Pause',
        Description: 'premium'
      }
    }
   
    // convert the payload to JSON
    const payloadJson = JSON.stringify(payload)
   
    // concatenate the API route and the payload
    const concatData = '/subscription' + payloadJson
   
     // generate the ePISignature following the instructions in the "How To Authenticate" section of the Recurring Billing API Integration Guide
   
    fetch('https://billing.epxuap.com/subscription', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'EPI-Id': epiId,
        'EPI-Signature': ePISignature,
      },
      body: JSON.stringify(payload)
    })
    .then(res => res.json()) // expecting a json response
    .then(data => {
      console.log(data)
      res.render('profile', {
        data,
        customer
      })
    });
   })
   
   