const letters = (function () {
    var lettersToSend = {
            letters: [],
            startInd: -1
        },
        stub = {
          add(letter,selection) {
            lettersToSend.letters[selection.getIndexInWord()] = letter;
            console.log(lettersToSend);
          },
          send(crossword,socket,selection) {
              var transformedLetters = [],
                  clue = crossword.clues[selection.getClueInd()];

              if (!lettersToSend.letters.length) {
                  return false;
              }

              lettersToSend.letters.forEach(function (letter, i) {
                  transformedLetters.push({
                      letter: letter[0],
                      pos: clue.isAcross ? [clue.pos[0], clue.pos[1] + i] : [clue.pos[0] + i, clue.pos[1]],
                      isCertain: letter.length === 1
                  });
              });

              socket.emit('letters', {
                  date: Date.now(),
                  letters: transformedLetters
              });
          }
        };

    return stub;
}());

module.exports = letters;
