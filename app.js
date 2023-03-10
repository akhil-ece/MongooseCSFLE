var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
const Encrypt = require('mongodb-client-encryption');
var Book = require('./Book.model');
require('dotenv').config();

run().catch(err => console.log(err));

async function run() {
    const arr = [];
    for (let i = 0; i < 96; ++i) {
      arr.push(i);
    }
    const key = Buffer.from(arr);
    const keyVaultNamespace = 'client.encryption';
    const kmsProviders = { local: { key } };

    var connection = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoEncryption: {
        keyVaultNamespace, 
        kmsProviders
      }
    });

  const { ClientEncryption } = Encrypt;
  const encryption = new ClientEncryption(mongoose.connection.client, {
      keyVaultNamespace,
      kmsProviders,
  });
}

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}));
app.get('/', function(req, res)
{
    res.send('Hello there');
});

app.get('/books', function(req, res)
{
    console.log('Getting all books');
    Book.find({})
    .exec(function(err, books){
        if(err)
        {
            res.send('error has occurred');
        }
        else
        {
            res.json(books);
            console.log(books);
        }
    });
});

app.get('/books/:id', function(req, res)
{
    console.log('getting one book');
    Book.findOne({
        _id: req.params.id
    })
    .exec(function(err, book){
        if(err)
        {
            res.send('Error Occurred');
        }
        else
        {
            console.log(book);
            res.json(book);
        }
    });
});

app.post('/book', function(req, res){
    console.log('Creating a book');

    var newBook = new Book();
    newBook.title = req.body.title;
    newBook.author = req.body.author;
    newBook.category = req.body.category;
    newBook.name = req.body.name;

    newBook.save(function(err, book){
        if(err)
        {
            res.send('error saving a book');
        }
        else
        {
            console.log(book);
            res.send(book);
        }
    });
});
app.post('/bookWhole', function(req, res){
    Book.create(req.body, function(err, book){
        if(err)
        {
            res.send('error saving a book');
        }
        else
        {
            console.log(book);
            res.send(book);
        }
    });
});

app.put('/book/:id', function(req, res){
    Book.findOneAndUpdate(
        {
            _id: req.params.id
        }, 
        {$set: 
            {title: req.body.title,
            name: req.body.name}
        }, 
        {upsert: true}, 
        function(err, newBook){
            if(err){
                console.log('Error Occurred');
            }
            else
            {
                console.log(newBook);
                res.send(newBook);
            }
        });
});

app.delete('/book/:id', function(req, res){
    Book.findOneAndRemove({
        _id: req.params.id
    }, function(err, book){
        if(err)
        {
            res.send('error deleting');
        }
        else
        {
            console.log(book);
            if(!book)
            {
                console.log('book not found with id');
                res.send('book not found with id');
            }
            else
            {
                res.sendStatus(204);
            }
        }
    })
})
var port = 8080;
app.listen(port, function()
{
    console.log('app listening on port '+ port);
});   