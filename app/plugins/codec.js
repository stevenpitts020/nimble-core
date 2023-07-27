module.exports = {
  base64Encode: function(str) {
    return Buffer.from(str).toString('base64')
  },

  base64Decode: function(encoded) {
    return Buffer.from(encoded, 'base64').toString('ascii')
  }
}
