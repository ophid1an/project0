// const Busboy = require('busboy');
// const util = require('util');

const Crossword = require('../models/crossword');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage
}).single('file-to-upload');


function crosswordUploadGet(req, res) {
  if (req.user.isAdmin) {
    res.render('upload-crossword');
  } else {
    res.redirect('/main');
  }
}

function crosswordUploadPost(req, res, next) {

  function checkCrossword(crosswordToTest) {

    const diff = crosswordToTest.difficulty;
    const dim = crosswordToTest.dimensions;
    const clues = crosswordToTest.clues;
    const bpos = crosswordToTest.blackPositions;

    if (!diff || !dim || !dim.length || dim.length !== 2 || !clues || !clues.length || clues.length < 1) {
      return false;
    }

    const total = bpos && bpos.length ? dim[0] * dim[1] - bpos.length : dim[0] * dim[1];

    if (total<1) {
      return false;
    }

    return new Crossword({
      language: crosswordToTest.language,
      difficulty: diff,
      totalWhite: total,
      dimensions: dim,
      blackPositions: bpos,
      clues: clues
    });

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
              success: [{
                msg: res.__('crosswordUploadSuccess')
              }]
            });
          });

        } else {
          res.render('upload-crossword', {
            errors: [{
              msg: res.__('crosswordParsingFailure')
            }]
          });
        }

      } catch (err) {
        return res.render('upload-crossword', {
          errors: [{
            msg: err
          }]
        });
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
