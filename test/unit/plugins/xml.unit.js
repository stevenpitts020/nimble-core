const target = require('../../../app/plugins/xml')

describe('app.plugins.xml', () => {
  it('should exist', () => {
    expect(target).not.to.be.undefined
  })

  it('should be a object', () => {
    expect(target).to.be.an('object')
  })

  it('should explose format() method', () => {
    expect(target.format).not.to.be.undefined
    expect(target.format).to.be.an('function')
  })

  it('should explose tag() method', () => {
    expect(target.tag).not.to.be.undefined
    expect(target.tag).to.be.an('function')
  })


  describe('xml.tag()', () => {
    it('should return string', () => {
      const result = target.tag('tag')
      expect(result).to.be.an('string')
    })

    it('should parse sinple tag', () => {
      const result = target.tag('tag')
      expect(result).to.equal('<tag/>')
    })

    it('should parse tag with props', () => {
      const result = target.tag('tag', { a: 1, b: 2, c: 3 })
      expect(result).to.equal('<tag a="1" b="2" c="3"/>')
    })

    it('should parse tag with value', () => {
      const result = target.tag('tag', {}, 'value')
      expect(result).to.equal('<tag>value</tag>')
    })

    it('should parse tag with props and value', () => {
      const result = target.tag('tag', { a: 1, b: 2 }, 'value')
      expect(result).to.equal('<tag a="1" b="2">value</tag>')
    })

    it('should parse tag with child tags', () => {
      const result = target.tag('tag', {}, [
        target.tag('childWithProp', { prop: 1 }),
        target.tag('childWithValue', {}, 'value'),
        target.tag('childWithPropAndValue', { prop: 2 }, 'value')
      ])
      expect(result).to.equal(`<tag><childWithProp prop="1"/>\n<childWithValue>value</childWithValue>\n<childWithPropAndValue prop="2">value</childWithPropAndValue></tag>`)
    })

    it.skip('should sanitize output', () => {
      /* eslint-disable */
      const result = [
        // control
        target.tag('tag', {}, 'control'),
        target.tag('tag', {}, 123),
        target.tag('tag', {}, 123.45),
        target.tag('tag', {}, 0),
        target.tag('tag', {}, true),
        target.tag('tag', {}, false),
        target.tag('tag', {}, undefined),
        target.tag('tag', {}, null),
        target.tag('tag', {}, "João Cárlôs Cì A(ento"),
        target.tag('tag', {}, [
          target.tag('subtag1', {}, 'sub control'),
          target.tag('subtag2', {}, 'sub control')
        ]),
        // comments
        target.tag('tag', {}, `javascript:/*--></title></style></textarea></script></xmp><svg/onload='+/"/+/onmouseover=1/+/[*/[]/+alert(1)//'>`),
        target.tag('tag', {}, `//*--> something`),
        target.tag('tag', {}, `<!-- something`),
        target.tag('tag', {}, `something --!>`),
        target.tag('tag', {}, `<!--#exec cmd="/bin/echo '<SCR'"--><!--`),
        // injection
        target.tag('tag', {}, `<AAA SRC="javascript:alert('XSS');"></AAA>`),
        target.tag('tag', {}, `<BBB SRC="jav	ascript:alert('XSS');"></BBB>`),
        target.tag('tag', {}, `<CCC SRC="jav&#x0D;ascript:alert('XSS');"></CCC>`),
        target.tag('tag', {}, '<DDD onload!#$%&()*~+-_.,:;?@[/|\]^`=alert("XSS")>something</DDD>'),
        // badly formed
        target.tag('tag', {}, `<unclosed`),
        target.tag('tag', {}, `something</unopened>`),
        target.tag('tag', {}, `something unopened/>`),
        target.tag('tag', {}, `<<<<`),
        target.tag('tag', {}, `</></></>`),
        target.tag('tag', {}, `\";alert('XSS');//`),
        // props
        target.tag('tag', {prop: 'should url encode this string', another: 'João Cárlôs Cì A(ento'})
      ]

      const resultTag = target.tag('result', {}, result)
      expect(target.format(resultTag)).to.equal(`<result>
  <tag>control</tag>
  <tag>123</tag>
  <tag>123.45</tag>
  <tag>0</tag>
  <tag>true</tag>
  <tag>false</tag>
  <tag/>
  <tag/>
  <tag>Jo%C3%A3o%20C%C3%A1rl%C3%B4s%20C%C3%AC%20A(ento</tag>
  <tag>
    <subtag1>sub%20control</subtag1>
    <subtag2>sub%20control</subtag2>
  </tag>
  <tag>javascript:%3C/title%3E%3C/style%3E%3C/textarea%3E%3C/script%3E%3C/xmp%3E%3Csvg/onload='+/%22/+/onmouseover=1/+/%5B*/%5B%5D/+alert(1)//'%3E</tag>
  <tag>/%20something</tag>
  <tag>%20something</tag>
  <tag>something%20--!%3E</tag>
  <tag>#exec%20cmd=%22/bin/echo%20'%3CSCR'%22</tag>
  <tag>%3CAAA%20SRC=%22javascript:alert('XSS');%22%3E%3C/AAA%3E</tag>
  <tag>%3CBBB%20SRC=%22jav%09ascript:alert('XSS');%22%3E%3C/BBB%3E</tag>
  <tag>%3CCCC%20SRC=%22jav&#x0D;ascript:alert('XSS');%22%3E%3C/CCC%3E</tag>
  <tag></tag>
  <tag></tag>
  <tag>something%3C/unopened%3E</tag>
  <tag>something%20unopened/%3E</tag>
  <tag>%3C%3C%3C%3C</tag>
  <tag>%3C/%3E%3C/%3E%3C/%3E</tag>
  <tag>%22;alert('XSS');//</tag>
  <tag prop="should%20url%20encode%20this%20string" another="Jo%C3%A3o%20C%C3%A1rl%C3%B4s%20C%C3%AC%20A(ento"/>
</result>`)

    })
  })

})


