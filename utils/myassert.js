var assert = require('assert');
if('production' === process.env.NODE_ENV) {
    var nil = function() { };
    module.exports = {
        equal: nil,
        notEqual: nil
        // all the other functions
    };
} else {
    // a wrapper like that one helps in not polluting the exported object
    module.exports = {
        equal: function(actual, expected, message) {
            assert.equal(actual, expected, message);
        },
        notEqual: function(actual, expected, message) {
            assert.notEqual(actual, expected, message);
        }
        // all the other functions
    };
}
