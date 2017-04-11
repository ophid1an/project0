require('dotenv').config();
var bcrypt = require('bcrypt');
const saltRounds = 10;
const myPlaintextPassword = '1234';
const someOtherPlaintextPassword = 'not_bacon';

//lets require/import the mongodb native drivers.
var mongodb = require('mongodb');

//We need to work with "MongoClient" interface in order to connect to a mongodb server.
var MongoClient = mongodb.MongoClient;

// Connection URL. This is where your mongodb server is running.
var url = process.env.MONGODB_URL || 'mongodb://localhost:27017/test';

// Use connect method to connect to the Server
MongoClient.connect(url, function(err, db) {
    if (err) {
        console.log('Unable to connect to the mongoDB server. Error:', err);
    } else {
        //HURRAY!! We are connected. :)
        console.log('Connection established to', url);

        // Get the documents collection
        var collection = db.collection('users');

        //Create some users
        var user1 = {
            name: 'modulus admin',
            age: 42,
            roles: ['admin', 'moderator', 'user']
        };
        var user2 = {
            name: 'modulus user',
            age: 22,
            roles: ['user']
        };
        var user3 = {
            name: 'modulus super admin',
            age: 92,
            roles: ['super-admin', 'admin', 'moderator', 'user']
        };

        // Insert user1
        bcrypt.hash(myPlaintextPassword, saltRounds, function(err, hash) {
            if (err)
                throw err;
            else {
                console.log(hash);
                //Store hash in your password DB.
                user1.password = hash;
                collection.insert([user1,user2,user3], function(err, result) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('Inserted %d documents into the "users" collection. The documents inserted with "_id" are:', result.length, result);
                    }
                    //Close connection
                    db.close();
                });
            }

        });

        // Insert users2,3
        // user2.password = '2345';
        // user3.password = '3456';
        // collection.insert([
        //     user2, user3
        // ], function(err, result) {
        //     if (err) {
        //         console.log(err);
        //     } else {
        //         console.log('Inserted %d documents into the "users" collection. The documents inserted with "_id" are:', result.length, result);
        //     }
        //     //Close connection
        //     db.close();
        // });
    }
});
