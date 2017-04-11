// const Busboy = require('busboy');
// const util = require('util');

const Crossword = require('../models/crossword');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage
}).single('file-to-upload');


// const vars = require('../config').vars;
// const limits = require('../config').limits;
// // const async = require('async');
// const jwt = require('jsonwebtoken');
// const jwtOptions = require('../config').jwtOptions;
// const cookiesOptions = require('../config').cookiesOptions;
// const bcrypt = require('bcrypt');
// const saltRounds = 10;



function crosswordUploadGet(req, res) {
  if (req.user.isAdmin) {
    res.render('upload-crossword');
  } else {
    res.redirect('/main');
  }
}

function crosswordUploadPost(req, res, next) {

  function checkCrossword(crosswordToTest) {
    // if (crosswordToTest.) {
    //   const crossword = new Crossword({
    //     language: crosswordToTest.language,
    //     difficulty: crosswordToTest.difficulty,
    //     totalLetters: crosswordToTest.dimensions[0] * crosswordToTest.dimensions[1] - crosswordToTest.blackPositions.length,
    //     dimensions: crosswordToTest.dimensions,
    //     blackPositions: crosswordToTest.blackPositions,
    //     clues: crosswordToTest.clues
    //   });
    //   return crossword;
    // }
    return false;

  }

  if (req.user.isAdmin) {
    upload(req, res, (err) => {
      if (err) {
        return next(err);
      }
      try {
        const crosswordToTest = JSON.parse(req.file.buffer.toString());

        const crossword = checkCrossword(crosswordToTest);

        if (crossword) {



          crossword.save(err => {

            if (err) {
              return next(err);
            }

            res.render('upload-crossword', {
              success: true
            });
          });

        } else {
          res.render('upload-crossword', {
            errors: true
          });
        }

      } catch (err) {
        return next(err);
      }

    });


  } else {
    res.redirect('/main');
  }
}

module.exports = {
  crosswordUploadGet: crosswordUploadGet,
  crosswordUploadPost: crosswordUploadPost
};
