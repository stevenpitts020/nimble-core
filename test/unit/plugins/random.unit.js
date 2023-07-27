const rand = require('../../../app/plugins/random')

describe('Random Plugin', () => {
  it('should exist', () => {
    expect(rand).not.to.be.undefined
  })

  describe('num()', () => {

    it('should exist', () => {
      expect(rand.num).not.to.be.undefined
    })

    it('should return random number', () => {
      expect(rand.num()).to.be.an('number')
    })

    it('should return random number between 1 and 9', () => {
      for (let i = 0; i <= 1000; i++) {
        let num = rand.num()
        expect(num).to.be.at.least(1).and.at.most(9)
      }
    })

  })

  describe('letter()', () => {
    it('should exist', () => {
      expect(rand.letter).not.to.be.undefined
    })

    it('should return random char', () => {
      let letter = rand.letter()
      expect(letter).to.be.an('string')
      expect(letter).to.have.lengthOf(1)
    })

    describe('ambiguous letters', () => {
      ['o', 'i', 'l'].forEach((oil) => {
        it(`should not return letter "${oil}" `, () => {
          for (let i = 0; i <= 1000; i++) {
            let letter = rand.letter()
            expect(letter).not.to.equal('oil')
          }
        })
      })
    })

  })

  describe('generateRecoveryCode()', () => {
    it('should exist', () => {
      expect(rand.num).not.to.be.undefined
    })

    it('should return 6 char string', () => {
      let code = rand.generateRecoveryCode()
      expect(code).to.be.an('string')
      expect(code).to.have.lengthOf(6)
    })

    it('should return all uppercase string', () => {
      let code = rand.generateRecoveryCode()
      expect(code.toUpperCase()).to.be.equal(code)
    })

  })

})
