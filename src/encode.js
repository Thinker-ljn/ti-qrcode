import { doRs } from './lib/gf.js'
const paddingLeftZero = function (num, n) {
  let len = num.toString().length
  while(len < n) {
      num = '0' + num
      len++
  }
  return num
}

const paddingRightZero = function (num, n) {
  let len = num.toString().length
  while(len < n) {
      num += '0'
      len++
  }
  return num
}

const getPaddingBytes = function (dataCodewords, padding) {
  // var padding = maxDc - (binarys.length / 8)
  const complementCodes = ['0b11101100', '0b00010001']
  var paddingBytes = []
  for (let i = 0; i < padding; i++ ) {
    paddingBytes.push(complementCodes[i % 2])
  }
  return paddingBytes
}

const getDataCodewords = function (binarys) {
  let result = []
  let length = binarys.length
  while (length > 0) {
    result.push('0b' + binarys.slice(result.length * 8, result.length * 8 + 8))
    length -= 8
  }
  return result
}

const doReassemble = function (arr) {
  const maxLen = arr.reduce((p, c) => {
    if (c.length > p) {
      p = c.length
    }
    return p
  }, 0)
  let result = []

  for (let i = 0; i < maxLen; i++) {
    for (let j = 0; j < arr.length; j++) {
      if (typeof arr[j][i] !== 'undefined') {
        let str = Number(arr[j][i]).toString(2)
        // complementZero(Number(arr[j][i]).toString(2), 8 - str.length)
        str = paddingLeftZero(Number(arr[j][i]).toString(2), 8)
        result.push(str)
      }
    }
  }
  return result
}

function Encode (option) {
  this.QRCode = option.QRCode
  this.encodeMode = option.QRCode.encodeMode
  this.inputData = option.inputData
  this.maxBits = this.QRCode.maxDc * 8
  // this.encodeType
  // this.start()
}

Encode.prototype = {

  start () {
    this.outputData = this.covertToBits()
      .addTerminator()
      .convertToDc()
      .subdividedDC()
      .geneECC()
      .constructFinalSequence()
    return this.outputData
  },

  covertToBits () {
    switch (this.encodeMode) {
      case '0001':
        this.binarys = this.encodeNumeric()
        break
      case '0010':
        this.binarys = this.encodeAlphanumeric()
        break
      case '0100':
        this.binarys = this.convertToUtf()
        break
    }
    return this
  },

  addTerminator () {
    this.binarys = (this.binarys + '0000').slice(0, this.maxBits)
    return this
  },

  convertToDc () {
    let binarys = this.binarys
    const dcCount = Math.ceil(binarys.length / 8)
    const length = dcCount * 8
    binarys = paddingRightZero(binarys, length)
    this.dataCodewords = getDataCodewords(binarys).concat(getPaddingBytes(binarys, this.QRCode.maxDc - dcCount))
    return this
  },

  subdividedDC () {
    const dataCodewords = this.dataCodewords
    const divBlocks = this.QRCode.divBlocks
    let pointer = 0
    let dcBlocks = []
    let ecNums = []
    while (pointer < divBlocks.length) {
      const bs = divBlocks[pointer]
      const ms = divBlocks[pointer + 1]
      const ds = divBlocks[pointer + 2]
      let start = 0
      for (let i = 0; i < bs; i++) {
        let end = start + ds
        dcBlocks.push(dataCodewords.slice(start, end))
        ecNums.push(ms - ds)
        start += ds
      }
      pointer += 3
    }
    this.DataCodewordBlock = dcBlocks
    this.ecNums = ecNums
    return this
  },

  geneECC () {
    const dcBlocks = this.DataCodewordBlock
    const ecNums = this.ecNums
    let EC = []
    for (let i in dcBlocks) {
      const block = dcBlocks[i]
      const num = ecNums[i]
      const arr = block.reduce((p, dc) => {
        p.push(Number(dc))
        return p
      }, [])
      const enc = doRs(num, arr)
      EC.push(enc.slice(arr.length))
    }
    this.errorCorrectionBlock = EC
    return this
  },

  constructFinalSequence () {
    const reassemble = doReassemble(this.DataCodewordBlock).concat(doReassemble(this.errorCorrectionBlock))
    return reassemble.join('')
  },

  // encodeNumeric
  encodeNumeric () {
    let bitsLength = 10
    const version = this.QRCode.version
    if (version >= 10 && version <= 26) {
      bitsLength = 12
    }
    if (version >= 27) {
      bitsLength = 14
    }
    const blocks = this.splitData(this.inputData)
    const binarys = this.encodeMode + this.encodeBlock(this.inputData.length, bitsLength) + this.encodeNumericBlocks(blocks, 10)
    return binarys
  },

  splitData (text, offset = 3) {
    var length = text.length
    var sp = []
    while (length > 0) {
      sp.push(text.slice(sp.length * offset, sp.length * offset + offset))
      length -= offset
    }
    return sp
  },

  encodeNumericBlocks (blocks, bitsLength) {
    let binarys = ''
    const lengths = [bitsLength, 4, 7]
    for (let block of blocks) {
      const length = lengths[block.length % 3]
      let binary = this.encodeBlock(block, length)
      binarys += binary
    }
    return binarys
  },

  encodeBlock (data, bitsLength) {
    let binary = Number(data).toString(2)
    const r = paddingLeftZero(binary, bitsLength)
    return r
  },

  encodeAlphanumeric () {
    let bitsLength = 9
    const version = this.QRCode.version
    if (version >= 10 && version <= 26) {
      bitsLength = 11
    }
    if (version >= 27) {
      bitsLength = 13
    }
    let blocks = this.splitData(this.inputData, 2)
    const binarys = this.encodeMode + this.encodeBlock(this.inputData.length, bitsLength) + this.encodeAlphanumericBlocks(blocks, 11)
    return binarys
  },

  encodeAlphanumericBlocks (blocks, bitsLength) {
    const _dict = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', ' ', '$', '%', '*', '+', '-', '.', '/', ':']
    const dict = _dict.reduce((p, c, i) => {
      p[c.charCodeAt()] = i
      return p
    }, {})
    let binarys = ''
    const lengths = [11, 6]
    for (let block of blocks) {
      const numBlock = block.length > 1 ? dict[block[0].charCodeAt()] * 45 + dict[block[1].charCodeAt()] : dict[block[0].charCodeAt()]
      let binary = this.encodeBlock(numBlock, lengths[block.length % 2])
      binarys += binary
    }
    return binarys
  },
  // encode utf-8
  // 将字符串格式化为UTF8编码的字节
  convertToUtf () {
    var str = this.inputData
    var back = [];
    var byteSize = 0;
    for (var i = 0; i < str.length; i++) {
      var code = str.charCodeAt(i);
      if (0x00 <= code && code <= 0x7f) {
        byteSize += 1;
        back.push(code);
      } else if (0x80 <= code && code <= 0x7ff) {
        byteSize += 2;
        back.push((192 | (31 & (code >> 6))));
        back.push((128 | (63 & code)))
      } else if ((0x800 <= code && code <= 0xd7ff)
              || (0xe000 <= code && code <= 0xffff)) {
        byteSize += 3;
        back.push((224 | (15 & (code >> 12))));
        back.push((128 | (63 & (code >> 6))));
        back.push((128 | (63 & code)))
      }
    }
    var bitsLength = 8
    if (this.QRCode.version >= 10) bitsLength = 16
    const binarys = back.reduce((p, c) => {
      p += paddingLeftZero(Number(c).toString(2), 8)
      return p
    }, '')
    return this.encodeMode + this.encodeBlock(this.inputData.length, bitsLength) + binarys
  }
}

export default Encode
