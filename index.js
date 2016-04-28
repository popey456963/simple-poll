var express = require('express')
var logger = require('log-js')('index.js')
var mongodb = require('mongodb')
var storage = require('node-persist')

var app = express()
var mongo = mongodb.MongoClient
var url = 'mongodb://localhost:27017/polls'
var db, collection

storage.initSync()
if (storage.getItemSync('currentPoll') == undefined) {
  storage.setItemSync('currentPoll', 0)
}
logger.log("Current Poll Question: " + storage.getItemSync('currentPoll'))

function addPoll(question, answers) {
  storage.setItemSync('currentPoll', storage.getItemSync('currentPoll') + 1)
  var answer = {}
  for (i=0; i<answers.length; i++) {
    answer[answers[i]] = 0
  }
  collection.insert({
    id: storage.getItemSync('currentPoll'),
    question: question,
    answers: answer
  }, function(err, result) {
    if (err) logger.error(err)
    else {
      logger.info("Created a poll with ID: " + storage.getItemSync('currentPoll'))
      return storage.getItemSync('currentPoll')
    }
  })
}

function getPolls(callback) {
  collection.find({}).toArray(function(err, result) {
    if (err) logger.error(err)
    else if (result.length) {
      callback(result)
    } else {
      logger.warning('There don\'t seem to be many polls at the moment...')
    }
  })
}

function getPoll(id, callback) {
  collection.find({id: parseInt(id)}).toArray(function(err, result) {
    if (err) logger.error(err)
    else if (result.length) {
      logger.log('Someone requested poll number ' + id)
      callback(result[0])
    } else {
      logger.warning('Someone requested a non-existant poll!')
      callback(false)
    }
  })
}

mongo.connect(url, function(err, database) {
  if (err) logger.error('Unable to connect to the mongoDB server. Error: ' + err)
  else {
    logger.success('Connection established to ' + url)
    db = database
    collection = db.collection('users')
    collection.createIndex({"id": 1}, {unique: true})
  }
})

app.get('/', function (req, res) {
  res.send('Poll Machine!')
  getPolls(function(data) {
    console.log(data)
  })
  addPoll("This is the first question", ["Answer1", "Answer2", "Answer3"])
  getPolls(function(data) {
    console.log(data)
  })
})

app.get('/favicon.ico', function (req, res) {
  res.send("")
})

app.get('/:pollid', function (req, res) {
  getPoll(req.params.pollid, function(data) {
    if (data) {
      res.send(JSON.stringify(data))
    } else {
      res.send("No Poll Found.")
    }
  })
})

app.listen(3000, function () {
  logger.log('Example app listening on port 3000!')
})