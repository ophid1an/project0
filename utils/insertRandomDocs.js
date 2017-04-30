var cw = {
    "zeroBased": true,
    "dimensions": [6, 6],
    "difficulty": "easy",
    "blackPositions": [
        [1, 3],
        [2, 1],
        [3, 4],
        [4, 2]
    ],
    "clues": [{
        "isAcross": true,
        "position": [0, 0],
        "answer": "ΚΑΜΒΑΣ",
        "text": "Ύφασμα κατάλληλο για κέντημα"
    }, {
        "isAcross": true,
        "position": [1, 0],
        "answer": "ΕΟΑ",
        "text": "Επιτροπή Ολυμπιακών Αγώνων"
    }, {
        "isAcross": true,
        "position": [1, 4],
        "answer": "ΛΕ",
        "text": "Δύο έχει το… λελέκι"
    }, {
        "isAcross": true,
        "position": [2, 2],
        "answer": "ΚΑΑΝ",
        "text": "Τζέιμς…: έπαιξε και στην ταινία \"Ο νονός\""
    }, {
        "isAcross": true,
        "position": [3, 0],
        "answer": "ΣΕΙΣ",
        "text": "Προσωπική αντωνυμία β' προσώπου"
    }, {
        "isAcross": true,
        "position": [4, 0],
        "answer": "ΑΠ",
        "text": "Έτσι αρχίζει ο… απέραντος"
    }, {
        "isAcross": true,
        "position": [4, 3],
        "answer": "ΕΒΟ",
        "text": "Ελληνική Βιομηχανία Όπλων"
    }, {
        "isAcross": true,
        "position": [5, 0],
        "answer": "ΠΟΣΤΙΣ",
        "text": "Είδος περούκας"
    }, {
        "isAcross": false,
        "position": [0, 0],
        "answer": "ΚΕΤΣΑΠ",
        "text": "Σάλτσα για… σάντουιτς"
    }, {
        "isAcross": false,
        "position": [0, 1],
        "answer": "ΑΟ",
        "text": "Τα έχει ο… λαός"
    }, {
        "isAcross": false,
        "position": [3, 1],
        "answer": "ΕΠΟ",
        "text": "Ποδοσφαιρική ομοσπονδία (αρχικά)"
    }, {
        "isAcross": false,
        "position": [0, 2],
        "answer": "ΜΑΚΙ",
        "text": "Γαλλική αντιστασιακή οργάνωση της Κατοχής"
    }, {
        "isAcross": false,
        "position": [2, 3],
        "answer": "ΑΣΕΤ",
        "text": "Εκδίδει γαλλικά βιβλία"
    }, {
        "isAcross": false,
        "position": [0, 4],
        "answer": "ΑΛΑ",
        "text": "Λέξη μαγειρικών συνταγών"
    }, {
        "isAcross": false,
        "position": [4, 4],
        "answer": "ΒΙ",
        "text": "Μισοτελειωμένη… βίλα"
    }, {
        "isAcross": false,
        "position": [0, 5],
        "answer": "ΣΕΝΙΟΣ",
        "text": "Φροντισμένος, καλλωπισμένος"
    }]
};

var DOCS_NUM = 1000;
var cws = [];
var difficulties = ['easy', 'medium', 'hard'];
var diffLength = difficulties.length;

function getDifficulty(callback) {
    var diff = difficulties[Math.floor(Math.random() * diffLength)];
    return callback(diff);
}


for (var i = 0; i < DOCS_NUM; i += 1) {
    cws.push(cw);
}
