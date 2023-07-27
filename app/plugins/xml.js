const format = require('xml-formatter')
const _ = require('lodash')

// will receive key:value object and spit out a string like this: a="1" b="2" c="3"
function inlineProps(props = {}) {
  return Object.keys(props).map(k => ` ${k}="${sanitize(props[k])}"`).join('')
}

// access to the formater lib with default options
const formaterFacade = (xml) => format(xml, {
  indentation: '  ',
  collapseContent: true,
  lineSeparator: '\n'
})

function hexChar(c) {
  // converts special chars into its hexed escape sequence
  const hex = c.codePointAt(0).toString(16)
  return "0000".substring(0, 4 - hex.length) + hex
}

function sanitize(str) {
  /* eslint-disable */
  try {
    // will try to format the given string
    formaterFacade("<xml>" + str + "</xml>")
  } catch (e) {
    return "" // failing to "format" should consider the tag empty to prevent broken xml
  }

  let result = new String(str)
    .replace(/([\uD800-\uDBFF][\uDC00-\uDFFF])/g, c => `&#${hexChar(c)};`) // escaping special unicode chars
    .replace(/[^\u0009\u000a\u000d\u0020-\uD7FF\uE000-\uFFFD]/g, '') // removing controll characters
    .replace(/\<\!\-\-/g, '') // removing comments tags
    .replace(/\-\-\>/g, '')
    .replace(/\/\*/g, '')
  return result
}


// simple and custom xml tag  builer. might explode
function tag(name, props = {}, children = []) {
  // self close tag
  if ((_.isArray(children) && _.isEmpty(children))
    || (_.isString(children) && _.isEmpty(children))
    || (children === null)) {
    return `<${name}${inlineProps(props)}/>`
  }

  // force children iteratable
  if (!_.isArray(children)) {
    children = [sanitize(children)]
  }

  // complex tag (props and children, assuming children are already either results of tag() or string)
  return `<${name}${inlineProps(props)}>${children.map(s => new String(s)).join('\n')}</${name}>`
}

module.exports = {
  tag,
  sanitize,
  format: formaterFacade
}