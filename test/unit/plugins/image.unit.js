const ImagePlugin = require("../../../app/plugins/image")

let ImageFactory = new ImagePlugin.constructor("bucketUrl://domain.com", "cdnUrl://")

describe("ImageFactory class", () => {
  it("should exist", () => {
    expect(ImageFactory).not.to.be.undefined
  })

  it("should have static Props", () => {
    expect(ImageFactory.uri).to.be.undefined //not static
    expect(ImageFactory.assetsLocation).to.be.an("string") // static
    expect(ImageFactory.cdnLocation).to.be.an("string") // static
  })

  it("should have defaults", () => {
    expect(ImageFactory.assetsLocation).to.equal("bucketUrl://domain.com")
    expect(ImageFactory.cdnLocation).to.equal("cdnUrl://")
  })

  describe(".asset()", () => {
    it("should have .asset() method", () => {
      expect(ImageFactory.asset).not.to.be.undefined
      expect(ImageFactory.asset).to.be.an("Function")
    })

    it("should return image object", () => {
      let img = ImageFactory.asset("img.jpg")

      expect(img).to.be.an("object")
      expect(img.default).not.to.be.undefined
    })

    it("should return image URL", () => {
      let img = ImageFactory.asset("img.jpg")

      expect(img.default).to.equal("bucketUrl://domain.com/img.jpg")
    })
  })

  describe(".cdn()", () => {
    it("should have .cdn() method", () => {
      expect(ImageFactory.cdn).not.to.be.undefined
      expect(ImageFactory.cdn).to.be.an("Function")
    })

    it("should return image object", () => {
      let img = ImageFactory.cdn("bucketUrl://domain.com/img.jpg")

      expect(img).to.be.an("object")
      expect(img.default).not.to.be.undefined
    })

    it("should return image URL (based on uri with full url)", () => {
      let img = ImageFactory.cdn("bucketUrl://domain.com/img.jpg")

      expect(img.default).to.equal("bucketUrl://domain.com/img.jpg")
    })
  })
})
