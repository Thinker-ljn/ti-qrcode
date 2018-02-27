import { getDataCodewords, RS_BLOCK_TABLE, reminderBits } from './common.js'
import { gfLog, gfExp } from '../lib/gf.js'

const split = function (text) {
  var length = text.length
  var sp = []
  while (length > 0) {
    sp.push(text.slice(sp.length * 3, sp.length * 3 + 3))
    length -= 3
  }
  return sp
}

const complementZero = function (str, count, lead = true) {
  if (count <= 0) return str
  for (var i = 0; i < count; i++) {
    if (lead) {
      str = '0' + str
    } else {
      str += '0'
    }
  }
  return str
}

const encodeNumericBlocks = function (blocks, bitsLength) {
  let binarys = ''
  const lengths = [bitsLength, 4, 7]
  for (let block of blocks) {
    const length = lengths[block.length % 3]
    let binary = encodeBlock(block, length)
    binarys += binary
  }
  return binarys
}
const encodeBlock = function (data, bitsLength) {
  let binary = Number(data).toString(2)
  const complement = bitsLength - binary.length
  // console.log(data, binary, bitsLength, complement)
  if (complement > 0) {
    binary = complementZero(binary, complement)
  }
  return binary
}
const splitDcToBlocks = function (DataCodewords, divBlocks) {
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
      dcBlocks.push(DataCodewords.slice(start, end))
      ecNums.push(ms - ds)
      start += ds
    }
    pointer += 3
  }
  return {dcBlocks: dcBlocks, ecNums: ecNums}
}
const encodeMsg = function (msgIn, nSym) {

  if (msgIn.length + nSym > 255)
    throw 'Message too long.';
  const mul = function (x, y) {
    if (x == 0 || y == 0) return 0;
    return gfExp[gfLog[x] + gfLog[y]];
  }

  const polyMul = function (p, q) {

    var r = Array.apply(null, new Array(p.length + q.length - 1)).map(function () { return 0; })

    for (var j = 0; j < q.length; j++) {
      for (var i = 0; i < p.length; i++) {
        r[i + j] ^= mul(p[i], q[j]);
      }

    }

    return r;

  }
  var g = [1];

  for (var i = 0; i < nSym; i++) {
    g = polyMul(g, [1, gfExp[i]]);
  }

  var gen = g;
  var msgOut = Array.apply(null, new Array(msgIn.length + nSym)).map(function () { return 0; })

  for (var i = 0; i < msgIn.length; i++)
    msgOut[i] = msgIn[i];

  for (var i = 0; i < msgIn.length; i++) {
    var coef = msgOut[i];
    if (coef != 0) {
      for (var j = 0; j < gen.length; j++) {
        msgOut[i + j] ^= mul(gen[j], coef);
      }
    }
  }

  for (var i = 0; i < msgIn.length; i++)
    msgOut[i] = msgIn[i];

  return msgOut;

}

const doRs = function (n, data) {
  var chunkSize = 255 - n;
  var enc = [];

  for (var i = 0; i < data.length; i += chunkSize) {
    var chunk = data.slice(i, i + chunkSize);
    enc = enc.concat(encodeMsg(chunk, n))
  }
  return enc;
}

const calcECInfo = function (dcBlock, ecNum) {
  let result = []
  for (let i in dcBlock) {
    const block = dcBlock[i]
    const num = ecNum[i]
    const arr = block.reduce((p, dc) => {
      p.push(Number(dc))
      return p
    }, [])
    const enc = doRs(num, arr)
    result.push(enc.slice(arr.length))
  }
  return result
}
const doInterlace = function (arr) {
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
        str = complementZero(Number(arr[j][i]).toString(2), 8 - str.length)
        // if (str.length !== 8) console.log(Number(arr[j][i]).toString(2), str)
        result.push(str)
      }
    }
  }
  return result
}

export default function (QRCode) {
  QRCode.prototype.encodeNumeric = function () {
    const numeric = this.data
    const version = this.version
    const maxDc = this.maxDc

    const codeFlag = '0001'
    const maxBits = maxDc * 8
    const length = numeric.length

    let bitsLength = 10
    if (version >= 10 && version <= 26) {
      bitsLength = 12
    }
    if (version >= 27) {
      bitsLength = 14
    }

    const blocks = split(numeric)
    let binarys = (codeFlag + encodeBlock(length, bitsLength) + encodeNumericBlocks(blocks, bitsLength) + '0000').slice(0, maxBits)
    binarys = complementZero(binarys, 8 - binarys.length % 8, false)
    // console.log(binarys, maxDc)
    const DataCodewords = getDataCodewords(binarys, maxDc)
    // return binarys
    const result = splitDcToBlocks(DataCodewords, this.divBlocks)
    // console.log(DataCodewords.reduce((p, c) => {return p + Number(c) + ', '; }, ''))
    const errorCorrection = calcECInfo(result.dcBlocks, result.ecNums)
    // console.log(errorCorrection, errorCorrection[0].reduce((p, c) => {return p + Number(c) + ', '; }, ''))
    const DataCodewordBlock = result.dcBlocks
    const interlace = doInterlace(DataCodewordBlock).concat(doInterlace(errorCorrection))
    // const reminderBits
    // console.log(interlace);
    // console.log(Number(bchEncode(0b11110)).toString(2))
    return interlace.join('')
  }
}