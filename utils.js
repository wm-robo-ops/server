module.exports.random = function (min, max, integer) {
  var d = max - min;
  var n = Math.random() * d + min;
  n = integer ? Math.floor(n) + 1 : n;
  return n;
};

var time = new Date();
module.exports.log = function(message) {
  console.log(time.toUTCString(Date.now()) + ':', message);
}
