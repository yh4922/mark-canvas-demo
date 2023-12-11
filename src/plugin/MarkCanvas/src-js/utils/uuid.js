
/**
 * 生成随机UUID
 */
function genUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    // tslint:disable-next-line: no-bitwise
    var r = Math.random() * 16 | 0
    // tslint:disable-next-line: no-bitwise
    var v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export { genUUID }