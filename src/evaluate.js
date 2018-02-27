function Evaluate () {

}

Evaluate.prototype = {
  start (matrix) {
    this.matrix = matrix
    this.penaltyScore = 0
    this.penalty = {
      row: 0,
      col: 0,
      block: 0,
      dldddldllll: 0,
      dlRate: 0
    }
    this.dark = 0
    this.light = 0
    this.calcScore()
      // .checkBlockSameColor()
      // .checkLikeDLDDDLDLLLL()
      // .checkDLRate()
    // console.log(this.penaltyScore, this.penalty)
    return this.penaltyScore
  },
  calcScore () {
    let penalty = 0
    const M = this.matrix
    for (let i = 0; i < M.length; i++) {
      this.row = {
        current: 0,
        num: 0
      }
      this.col = {
        current: 0,
        num: 0
      }
      for (let j = 0; j < M.length; j++) {
        this.checkLineSameColor(M[i][j], j === M.length - 1, 'row')
        this.checkLineSameColor(M[j][i], j === M.length - 1, 'col')
        this.checkBlockSameColor(i, j)
        this.checkLikeDLDDDLDLLLL(i, j)
        this.checkDLNum(M[i][j])
      }
    }
    const total = this.dark + this.light
    const darkR = this.dark / total * 100 // Math.floor()
    const darkPrev = Math.abs(Math.floor(darkR / 5) * 5 - 50) / 5
    const darkNext = Math.abs(Math.ceil(darkR / 5) * 5 - 50) / 5
    if (darkPrev < darkNext) {
      this.penaltyScore += darkPrev * 10
      this.penalty.dlRate = darkPrev * 10
    } else {
      this.penaltyScore += darkNext * 10
      this.penalty.dlRate = darkPrev * 10
    }
  },
  checkLineSameColor (p, isLast, key) {
    if (p !== this[key].current) {
      if (this[key].num >= 5) {
        this.penaltyScore += this[key].num - 2
        this.penalty[key] += this[key].num - 2
      }
      this[key].current = p
      this[key].num = 1
    } else {
      this[key].num++
      if (isLast && this[key].num >= 5) {
        this.penaltyScore += this[key].num - 2
        this.penalty[key] += this[key].num - 2
      }
    }
  },
  checkBlockSameColor (i, j) {
    const M = this.matrix
    if (i === M.length - 1 || j === M.length - 1) {
      return false
    }
    if (M[i][j] && M[i + 1][j] && M[i][j + 1] && M[i + 1][j + 1]) {
      this.penaltyScore += 3
      this.penalty.block += 3
    }
    if (!M[i][j] && !M[i + 1][j] && !M[i][j + 1] && !M[i + 1][j + 1]) {
      this.penaltyScore += 3
      this.penalty.block += 3
    }
  },
  checkLikeDLDDDLDLLLL (i, j) {
    const M = this.matrix
    // if (i > M.length - 11 || j > M.length - 11) {
    //   return false
    // }
    const pattern1 = i > M.length - 11 ? 0 : !M[i][j] && !M[i + 1][j] && !M[i + 2][j] && !M[i + 3][j] && M[i + 4][j] && !M[i + 5][j] && M[i + 6][j] && M[i + 7][j] && M[i + 8][j] && !M[i + 9][j] && M[i + 10][j]
    const pattern2 = j > M.length - 11 ? 0 : !M[i][j] && !M[i][j + 1] && !M[i][j + 2] && !M[i][j + 3] && M[i][j + 4] && !M[i][j + 5] && M[i][j + 6] && M[i][j + 7] && M[i][j + 8] && !M[i][j + 9] && M[i][j + 10]

    const pattern3 = i > M.length - 11 ? 0 : M[i][j] && !M[i + 1][j] && M[i + 2][j] && M[i + 3][j] && M[i + 4][j] && !M[i + 5][j] && M[i + 6][j] && !M[i + 7][j] && !M[i + 8][j] && !M[i + 9][j] && !M[i + 10][j]
    const pattern4 = j > M.length - 11 ? 0 : M[i][j] && !M[i][j + 1] && M[i][j + 2] && M[i][j + 3] && M[i][j + 4] && !M[i][j + 5] && M[i][j + 6] && !M[i][j + 7] && !M[i][j + 8] && !M[i][j + 9] && !M[i][j + 10]
    // if (i === 18 && j === 0) console.log('18, 0', pattern1, pattern2, pattern3, pattern4)
    if (pattern1 || pattern2 || pattern3 || pattern4) {
      // console.log(i, j)
      this.penaltyScore += 40
      this.penalty.dldddldllll += 40
    }
  },
  checkDLNum (p) {
    if (p) {
      this.dark++
    } else {
      this.light++
    }
  }
}

export default Evaluate
