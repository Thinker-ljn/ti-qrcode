import Matrix from './matrix'
import Encode from './encode.js'
import Evaluate from './evaluate.js'
import { MAX_DATA_CODEWORD_TABLE, RS_BLOCK_TABLE, ECLs, viDict } from './common.js'

function QRCode (option) {
  this.container = option.container || null
  this.generateType = option.type || 'array'

  this.data = option.data
  this.ecl = option.ecl
  this.eclCode = ECLs[this.ecl]
  this.eclIndex = Object.keys(ECLs).findIndex((v) => {return v === this.ecl})

  this.anlysisData()
  this.setVersion()
  this.width = (this.version - 1) * 4 + 21

  this.maxDc = MAX_DATA_CODEWORD_TABLE[this.version - 1][this.eclIndex] + 2
  this.divBlocks = RS_BLOCK_TABLE[(this.version - 1) * 4 + this.eclIndex]

  this.vi = this.version > 6 ? viDict[this.version] : null
  this.px = 10
}

QRCode.prototype = {
  draw: function (canvas, matrix) {
    // const canvas = option.canvas || document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.width = this.width * this.px
    canvas.height = this.width * this.px
    context.fillStyle = this.color || '#000'
    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix.length; j++) {
        const p = Number(matrix[i][j])
        if (p === 1) {
          this.drawPx(i, j, context)
        } else {
          // context.strokeRect(i * this.px, j * this.px, this.px, this.px)
        }
      }
    }
  },
  drawPx: function (x, y, context) {
    context.fillRect(x * this.px, y * this.px, this.px, this.px)
  },
  anlysisData () {
    if (/^[0-9]+$/.test(this.data)) {
      this.encodeMode = '0001'
      const bits = [0, 4, 7]
      this.dataCodewordLength = Math.ceil((this.data.length / 3 * 10 + bits[this.data.length % 3]) / 8)
    } else if (/^[A-Z0-9\$\*\.\+%-/: ]+$/.test(this.data)) {
      this.encodeMode = '0010'
      this.dataCodewordLength = Math.ceil((this.data.length / 2 * 11 + (this.data.length % 2) * 6) / 8)
    } else {
      this.encodeMode = '0100'
      this.dataCodewordLength = this.data.length
    }
  },
  setVersion () {
    // console.log(this.dataCodewordLength)
    const dict = MAX_DATA_CODEWORD_TABLE
    for (let v = 0; v < dict.length; v++) {
      const version = v + 1
      if (dict[v][this.eclIndex] > this.dataCodewordLength) {
        this.version = v + 1
        break
      }
    }
  }
}

QRCode.prototype.generate = function () {
  const encode = new Encode({
    QRCode: this,
    inputData: this.data
  })
  // console.log(encode)
  this.dataSteam = encode.start()
  this.matrixes = []
  let penalty = null
  let select = []
  const masks = ['000', '001', '010', '011', '100', '101', '110', '111']
  const eva = new Evaluate()
  for (let i = 0; i < masks.length; i++) {
    const m = new Matrix({
      QRCode: this,
      mask: masks[i]
    })
    const matrix = m.generare()
    this.matrixes.push(matrix)
    // this.draw(document.getElementById('canvas-' + masks[i]), matrix)

    // console.log(masks[i])
    const score = eva.start(matrix)
    if (penalty === null || score < penalty) {
      penalty = score
      select[0] = masks[i]
      select[1] = matrix
    }
  }
  // document.getElementById('mask').innerHTML = select[0]
  if (this.container) {
    this.draw(document.querySelector(this.container), select[1])
  } else {
    return select[1]
  }
}

export default QRCode
module.exports = QRCode;