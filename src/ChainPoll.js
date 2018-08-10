export default class {
  constructor(resolutor) {
    this.resolutor = resolutor

    this.poll = []
  }

  async demand(resolutor = this.resolutor) {
    const toWait = [...this.poll]
    this.poll.splice(0, this.poll.length)

    return new Promise(async resolve => {
      const demandPromise = Promise.all(toWait).then(async () => {
        resolve(await resolutor())

        const index = this.poll.indexOf(demandPromise)
        if (index > -1) {
          this.poll.splice(index, 1)
        }
      })

      this.poll.push(demandPromise)
    })
  }
}
