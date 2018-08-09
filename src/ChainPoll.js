let count = 0

export default class {
  constructor(resolutor) {
    this.resolutor = resolutor

    this.poll = []
  }

  async demand(resolutor = this.resolutor) {
    const demand = ++count

    return new Promise(async resolve =>
      this.poll.push(
        Promise.all([...this.poll]).then(async () => {
          resolve(await resolutor())

          this.poll.pop()
        }),
      ),
    )
  }
}