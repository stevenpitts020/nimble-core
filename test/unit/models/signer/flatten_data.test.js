const signerModel = require('../../../../app/models/signer')


describe('app.models.signer.flattenData', () => {
  const target = signerModel.flattenData

  it('should exist', () => {
    expect(signerModel.flattenData).not.to.be.undefined
    expect(signerModel.flattenData).to.be.an('function')
  })

  it('should return an object', () => {
    const result = target({})

    expect(result).to.be.an('object')
    expect(result).to.deep.equal({})
  })


  it('should flatten data', () => {
    const result = target({
      somethingA: 'somethingA',
      somethingB: 'somethingB',
      idProofDocument: {
        backDocumentId: 'backDocumentId',
        frontDocumentId: 'frontDocumentId',
        type: 'type',
        number: 'number',
        issuedDate: 'issuedDate',
        issuer: 'issuer',
        expirationDate: 'expirationDate',
      }
    })

    expect(result).to.be.an('object')
    expect(result).to.deep.equal({
      'somethingA': 'somethingA',
      'somethingB': 'somethingB',
      'backIdProofDocumentId': 'backDocumentId',
      'frontIdProofDocumentId': 'frontDocumentId',
      'documentType': 'type',
      'documentNumber': 'number',
      'documentIssuedDate': 'issuedDate',
      'documentIssuer': 'issuer',
      'documentExpirationDate': 'expirationDate',
    })
  })



  it('should not flatten data not set', () => {
    const result = target({
      somethingA: 'somethingA',
      somethingB: 'somethingB',
      otherObject: {
        backDocumentId: 'backDocumentId',
        frontDocumentId: 'frontDocumentId',
        type: 'type',
        number: 'number',
        issuedDate: 'issuedDate',
        issuer: 'issuer',
        expirationDate: 'expirationDate',
      }
    })

    expect(result).to.be.an('object')
    expect(result).to.deep.equal({
      'somethingA': 'somethingA',
      'somethingB': 'somethingB',
      'otherObject': {
        'backDocumentId': 'backDocumentId',
        'frontDocumentId': 'frontDocumentId',
        'type': 'type',
        'number': 'number',
        'issuedDate': 'issuedDate',
        'issuer': 'issuer',
        'expirationDate': 'expirationDate',
      }
    })
  })


  it('should flatten partial data', () => {
    const result = target({
      somethingA: 'somethingA',
      somethingB: 'somethingB',
      idProofDocument: {
        backDocumentId: 'backDocumentId',
        frontDocumentId: 'frontDocumentId',
        type: 'type',
      }
    })

    expect(result).to.be.an('object')
    expect(result).to.deep.equal({
      'somethingA': 'somethingA',
      'somethingB': 'somethingB',
      'backIdProofDocumentId': 'backDocumentId',
      'frontIdProofDocumentId': 'frontDocumentId',
      'documentType': 'type',
    })
  })

  it('should respect null on partial updates', () => {
    const result = target({
      somethingA: 'somethingA',
      somethingB: 'somethingB',
      idProofDocument: {
        backDocumentId: 'backDocumentId',
        frontDocumentId: 'frontDocumentId',
        type: null,
      }
    })

    expect(result).to.be.an('object')
    expect(result).to.deep.equal({
      'somethingA': 'somethingA',
      'somethingB': 'somethingB',
      'backIdProofDocumentId': 'backDocumentId',
      'frontIdProofDocumentId': 'frontDocumentId',
      'documentType': null,
    })
  })


  it('should ignore if present but empty', () => {
    const result = target({
      somethingA: 'somethingA',
      somethingB: 'somethingB',
      idProofDocument: {
      }
    })

    expect(result).to.be.an('object')
    expect(result).to.deep.equal({
      'somethingA': 'somethingA',
      'somethingB': 'somethingB',
    })
  })


  it('should ignore not expected data', () => {
    const result = target({
      somethingA: 'somethingA',
      somethingB: 'somethingB',
      idProofDocument: {
        number: 'number',
        badField: 'bad',
        otherField: 'also bad'
      }
    })

    expect(result).to.be.an('object')
    expect(result).to.deep.equal({
      'somethingA': 'somethingA',
      'somethingB': 'somethingB',
      'documentNumber': 'number',
    })
  })

})
