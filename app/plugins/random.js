class Random {

  /**
   * @returns {number} will return a single number between 1 and 9
   */
  num() {
    return Math.ceil(Math.random() * 9) // 1-9 because zero is ambiguous
  }

  /**
   * @returns {string} will return a single char excluding `o`, `i` and `l`
   */
  letter() {
    return Math.random()
      .toString(36) // abc trick
      .replace(/[^a-z]+/g, '') // only letters
      .substr(0, 1) // first char
      .replace(/[ilo]/g, 'x') // replace ambiguous letters with X
  }

  /**
   * @returns {string} will return a 6 char string similar to X11ABC
   */
  generateRecoveryCode() {
    return [
      this.letter(),
      this.num(),
      this.num(),
      this.letter(),
      this.letter(),
      this.letter()
    ].join('').toUpperCase()
  }

  id(length = 8) {
    length = length || 8 // default to a length of 8
    let id = ''
    const domain = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const domainSize = domain.length
    for (var i = 0; i < length; i++) {
      id += domain.charAt(Math.floor(Math.random() * domainSize))
    }

    return id
  }
}

module.exports = new Random()
