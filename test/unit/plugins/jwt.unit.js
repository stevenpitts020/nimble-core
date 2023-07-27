const plugin = require('../../../app/plugins/jwt')

function waitSomeTime(i = 1) {
  return new Promise(accept => {
    return setTimeout(() => {
      accept()
    }, i * 100 + Math.random() * 100)
  })
}

describe('Services', () => {
  describe('JWT plugin', () => {
    const invalidSignatureToken =
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpZCI6MSwiYXQiOjE1NTExMTI2MTc2MDJ9.-f60eL8IqeqYPjJV21zwyDJAyh7Alv7wByX8IU9Z6RZunOIwjORzGyssebeEgvLiRZIKZA-5kyQ7aC0Ygdo6yw'

    const tokensForSameId = [
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpZCI6MSwiYXQiOjE1NTExMTI2MTc2MDJ9.crVP7Pn3J8NSyahW3Uw9JFYH7uSEqqEOhu9M5LuobBdyeAnUv1ac7ceN_ue4UUrJFdoN7lMUdLdh2VlVsScmvg',
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpZCI6MSwiYXQiOjE1NTExMTI2MTc2MzJ9.th_8BWXZpDXC3lycGYVguV-CVttzlx7YCYRkyfuly_-ZWwAQwn0Mm1eNz0Hvt4GaonrPozcSH90wVYKkggfWHw',
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpZCI6MSwiYXQiOjE1NTExMTI2MTc2NTF9.lsIqPFLk2LCTV8cmt2Sb7wzRFe90RvjyvdRl1hTISWAzX4bTSjTgYaT_Z6pTWwVDerbkDVT3LR0dMI_dUlk7iQ',
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpZCI6MSwiYXQiOjE1NTExMTI2MTc2MTB9.9HHafHVaoBq9Z2Haxuawb5UP6sZE450DHgRzgPnmAf7wr3lMXmo-Ywuy0sVvQMLp8nG2721KsI2PjIYmo8_5sQ',
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpZCI6MSwiYXQiOjE1NTExMTI2MTc2NTV9.dK7_EbC1ipKEfKcL_flX6Iti5CYoWT3lmEX_XIjueQZj2P9TsQ8EJNtPrXKXl2k44J080ypVWSbpoejVmoKtNw'
    ]

    const tokensForDifferentId = [
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpZCI6MSwiYXQiOjE1NTExMTMwNjQ0NzJ9.0cIKDSU7USIxDsxaKKCVZOtO1YjndMSgHGky30GYyR_N1KOPgLNCEg7wOu9PKSDYRqeQd6M_GJZgfb__9evRkA',
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpZCI6MjIsImF0IjoxNTUxMTEzMDY0NDU1fQ.JhTVsiadzPqzriBFWAhajNkf54gvJvY3rVw7o1bnvFJjt8edACAHeMhOqIraWYxvj0yLkrjAVDW2XypPR-g3BQ',
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpZCI6MzMzLCJhdCI6MTU1MTExMzA2NDQ4MX0.qBOdKjZ0lf0B7HKCP6HFQAuq4WfgxrOF5TwMOA53MeaDKsViZydx0K58ZSqCjfbO7ZqMdKnB-YnG8bsjAVG90Q',
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpZCI6NDQ0NCwiYXQiOjE1NTExMTMwNjQ1MjJ9.19z3nds7M2xlguA9fChwgoLGXsl7h760-G-l_Kk3U5U0l0t6rODXWUdL9wc69tQF5AiZHUY1ALsmvqtc0TgG9Q',
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpZCI6NTU1NTUsImF0IjoxNTUxMTEzMDY0NDg5fQ.-f60eL8IqeqYPjJV21zwyDJAyh7Alv7wByX8IU9Z6RZunOIwjORzGyssebeEgvLiRZIKZA-5kyQ7aC0Ygdo6yw'
    ]
    it('should exist', () => {
      expect(plugin).not.to.be.undefined
    })

    it('should have encode() method', () => {
      expect(plugin).to.have.own.property('encode')
      expect(plugin.encode).not.to.be.undefined
      expect(plugin.encode).to.be.a('function')
    })

    it('should have decode() method', () => {
      expect(plugin).to.have.own.property('encode')
      expect(plugin.decode).not.to.be.undefined
      expect(plugin.decode).to.be.a('function')
    })

    describe('encode() mehtod', () => {
      it('should output string', () => {
        let result = plugin.encode({ id: 1 })

        expect(result).to.be.a('string')
      })

      it('should be a JWT token', () => {
        let result = plugin.encode({ id: 1 })
        expect(result.split('.')).to.have.lengthOf(3)
      })

      it('should generate different tokens for diferent IDs', async () => {
        let tokens = await Promise.all(
          [1, 22, 333, 4444, 55555].map(async (id, index) => {
            await waitSomeTime(index)
            return plugin.encode({ id })
          })
        )
        let unique_tokens = _.uniq(tokens)
        expect(unique_tokens).to.have.lengthOf(5)
      })
    })

    describe('decode() method', () => {
      it('should decode token and return the payload', () => {
        tokensForSameId.forEach(token => {
          let payload = plugin.decode(token)
          expect(payload).not.to.be.undefined
          expect(payload).to.have.property('at')
        })
      })

      it('should decode tokens for the same ID', () => {
        let decodedTokens = tokensForDifferentId.map(plugin.decode)

        expect(decodedTokens[0].id).to.equal(1)
        expect(decodedTokens[1].id).to.equal(22)
        expect(decodedTokens[2].id).to.equal(333)
        expect(decodedTokens[3].id).to.equal(4444)
        expect(decodedTokens[4].id).to.equal(55555)
      })

      it('should decode the payload', () => {
        let token = plugin.encode({
          foo: 'far',
          bar: 1234
        })

        let result = plugin.decode(token)
        expect(result).to.have.own.property('foo')
        expect(result).to.have.own.property('bar')

        expect(result.foo).to.equal('far')
        expect(result.bar).to.equal(1234)
      })

      describe('validation', () => {
        it('should complain about malformed tokens', () => {
          expect(() => {
            plugin.decode('THIS IS NOT A TOKEN')
          }).to.throw('Not enough or too many segments')
        })

        it('should complain about invalid tokens', () => {
          expect(() => {
            plugin.decode('not.avalid.token')
          }).to.throw('Unexpected token')
        })

        it('should complain about invalid signatures', () => {
          expect(() => {
            plugin.decode(invalidSignatureToken)
          }).to.throw('Signature verification failed')
        })
      })
    })
  })
})
