import {fiDict} from './common.js'
function Matrix (option) {
  this.QRCode = option.QRCode
  this.mask = option.mask
  this.sideLength = this.getSidelength()
}

Matrix.prototype = {
  initMatrixes: function () {
    this.matrixes = []
    const width = this.sideLength
    for (let i = 0; i < width; i++) {
      this.matrixes.push([])
      for (let j = 0; j < width; j++) {
        this.matrixes[i][j] = -1
      }
    }
  },

  getSidelength: function () {
    return (this.QRCode.version - 1) * 4 + 21
  },

  generare: function () {
    this.initMatrixes()
    this.fillPDP()
    this.fillTP()
    this.fillFI()
    if (this.QRCode.version > 1) this.fillAP()
    if (this.QRCode.version > 6) this.fillVI()
    this.fillDATA()
    return this.matrixes
  },

  drawPx: function (x, y) {
    this.context.fillRect(x * px, y * px, px, px)
  },

  getPDPPoints: function () {
    var ps = []
    for (var i = 0; i < 7; i++) {
      for (var j = 0; j < 7; j++) {
        let p = [i, j]

        var H = (i === 1 || i === 5) && j > 0 && j < 6
        var V = (j === 1 || j === 5) && i > 0 && i < 6
        if (H || V) {
          // continue
          p.push(0)
        } else {
          p.push(1)
        }
        ps.push(p)
      }
    }
    return ps
  },

  getAPCenterPoints: function () {
    if (this.QRCode.version < 2) return []
    var sideCount = Math.floor(this.QRCode.version / 7) + 2
    // var count = sideCount * sideCount - 3
    var first = 6
    var last = this.sideLength - 7
    var offset = this.QRCode.version === 32 ? 26 : Math.ceil((last - first) / (sideCount - 1))
    if (offset % 2 === 1) offset += 1
    var sp = []
    for (var i = 0; i < sideCount; i++) {
      var p = sideCount === i + 1 ? first : last - i * offset
      sp.unshift(p)
    }
    var cp = []
    var lastIndex = sp.length - 1
    for (var i = 0; i < sp.length; i++) {
      for (var j = 0; j < sp.length; j++) {
        if (i === 0 && j === 0 || i === 0 && j === lastIndex || j === 0 && i === lastIndex) {
          continue
        }
        cp.push([sp[i], sp[j]])
      }
    }
    return cp
  },

  getAPPoints: function () {
    var ps = []
    for (var i = -2; i < 3; i++) {
      for (var j = -2; j < 3; j++) {
        let p = [i, j]
        var H = (i === -1 || i === 1) && j > -2 && j < 2
        var V = (j === -1 || j === 1) && i > -2 && i < 2
        if (H || V) {
          // continue
          p.push(0)
        } else {
          p.push (1)
        }
        ps.push(p)
      }
    }
    return ps
  },

  getTPPoints: function () {
    var p = 6
    var ps = []
    var offset = this.sideLength - 7 - 7
    for (let i = 0; i < offset; i++) {
      ps.push([p + i, p, (i + 1) % 2])
      ps.push([p, p + i, (i + 1) % 2])
    }

    let op = this.sideLength - 8
    ps.push([7, 7, 0])
    ps.push([7, op, 0])
    ps.push([op, 7, 0])
    for (let i = 1; i <= 7; i++) {
      let pM = 7 - i
      let pA = op + i
      ps.push([7, pM, 0])
      ps.push([pM, 7, 0])

      ps.push([pM, op, 0])
      ps.push([7, pA, 0])

      ps.push([pA, 7, 0])
      ps.push([op, pM, 0])
    }
    return ps
  },

  getFIPoints: function () {
    const key = Number('0b' + this.QRCode.eclCode + this.mask)
    const fi = fiDict[key]
    let op = this.sideLength - 8
    let ps1 = [[8, 8]]
    let ps2 = [[op, 8]]
    const dm = [8, op, 1]
    for (let i = 0; i < 8; i++) {
      if (i !== 1) {
        ps1.unshift([7 - i, 8])
        ps1.push([8, 7 - i])
      }
      if (i !== 0) {
        ps2.push([op + i, 8])
        ps2.unshift([8, op + i])
      }
    }

    for (let i = 0; i < 15; i++) {
      ps1[i].push(Number(fi[i]))
      ps2[i].push(Number(fi[i]))
    }
    let result = ps1.concat(ps2)
    result.push(dm)
    return result
  },

  getVIPoints: function () {
    const vi = this.QRCode.vi.split('').reverse().join('')
    const op = this.sideLength - 11
    const ps = []
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 3; j++) {
        ps.push([i, op + j, vi[i * 3 + j]])
        ps.push([op + j, i, vi[i * 3 + j]])
      }
    }
    return ps
  },

  fillAP: function () {
    var points = this.getAPPoints()
    var centerPoints = this.getAPCenterPoints()
    for (var i = 0; i < centerPoints.length; i++) {
      for (var j = 0; j < points.length; j++) {
        var cp = centerPoints[i]
        var p = points[j]
        this.matrixes[p[0] + cp[0]][p[1] + cp[1]] = p[2]
      }
    }
  },

  fillTP: function () {
    var points = this.getTPPoints()
    for (var i = 0; i < points.length; i++) {
      var p = points[i]
      this.matrixes[p[0]][p[1]] = p[2]
    }
  },

  fillPDP: function () {
    var points = this.getPDPPoints()
    var offset = this.sideLength - 7

    for (var i = 0; i < points.length; i++) {
      var p = points[i]
      this.matrixes[p[0]][p[1]] = p[2]
      this.matrixes[p[0] + offset][p[1]] = p[2]
      this.matrixes[p[0]][p[1] + offset] = p[2]
    }
  },

  fillFI: function () {
    const points = this.getFIPoints()
    for (var i = 0; i < points.length; i++) {
      var p = points[i]
      this.matrixes[p[0]][p[1]] = p[2]
    }
  },

  fillVI: function () {
    const points = this.getVIPoints()
    for (var i = 0; i < points.length; i++) {
      var p = points[i]
      this.matrixes[p[0]][p[1]] = p[2]
    }
  },

  fillDATA: function () {
    const dataSteam = this.QRCode.dataSteam
    const count = this.sideLength - 1
    let dp = 0
    let reverse = true
    let zb = ''
    let xor
    for (let row = count; row >= 0; row -= 2) {
      if (row === 6) row--
      reverse = !reverse
      for (let col = count; col >= 0; col--) {
        const _col = reverse ? count - col : col
        if (dp >= dataSteam.length && this.matrixes[row][_col] === -1) {
          this.matrixes[row][_col] = 0
        } else {
          xor = this.getXor(_col, row)
          if (this.matrixes[row][_col] === -1) {
            this.matrixes[row][_col] = dataSteam[dp] ^ xor
            dp++
          }
          xor = this.getXor(_col, row - 1)
          if (this.matrixes[row - 1][_col] === -1) {
            this.matrixes[row - 1][_col] = dataSteam[dp] ^ xor
            dp++
          }
        }
      }
    }
  },

  getXor: function (i, j) {
    let xor
    switch (this.mask) {
      case '000':
        xor = (i + j) % 2 === 0 ? 0x1 : 0x0
        break
      case '001':
        xor = i % 2 === 0 ? 0x1 : 0x0
        break
      case '010':
        xor = j % 3 === 0 ? 0x1 : 0x0
        break
      case '011':
        xor = (i + j) % 3 === 0 ? 0x1 : 0x0
        break
      case '100':
        xor = ((i / 2) + (j / 3)) % 2 === 0 ? 0x1 : 0x0
        break
      case '101':
        xor = i * j % 2 + i * j % 3 === 0 ? 0x1 : 0x0
        break
      case '110':
        xor = (i * j % 2 + i * j % 3) % 2 === 0 ? 0x1 : 0x0
        break
      case '111':
        xor = (i * j % 3 + (i + j) % 2) % 2 === 0 ? 0x1 : 0x0
        break
    }
    return xor
  }
}

export default Matrix