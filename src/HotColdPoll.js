import ChainPoll from './ChainPoll'

function createItem(content) {
  return {
    content,
    inUse: false,
  }
}

let uuid = 0

export const messages = {
  BLOCK: 'BLOCK',
  GO: 'GO',
  REMOVE: 'REMOVE',
  START: 'START',
}

export default class {
  constructor({ createCold, createHot, maxSize, minSize }) {
    this.createCold = createCold
    this.createHot = createHot
    this.maxSize = Math.max(1, Math.max(minSize, maxSize))
    this.minSize = minSize

    this.poll = []
    this.waitPoll = new ChainPoll()
    this.usagePoll = []
    this.waitUsagePoll = new ChainPoll()
  }

  async init() {
    this.poll.push(
      ...(await Promise.all(Array.from({ length: this.minSize }).map(async () => createItem(await this.createHot())))),
    )
  }

  async get(notify = () => {}) {
    return new Promise(resolveItem =>
      this.waitPoll.demand(
        () =>
          new Promise(resolveDemand => {
            const usagePromise = new Promise(async resolveUsage => {
              const usage = this.poll.filter(({ inUse }) => inUse).length
              const shouldWait = usage >= this.maxSize

              const previousPoll = [...this.usagePoll]
              const toWait = shouldWait ? Promise.race(previousPoll) : null

              notify(shouldWait ? messages.BLOCK : messages.GO, usage, this.maxSize, previousPoll.length)

              this.waitUsagePoll.demand(
                () =>
                  new Promise(async resolveUsageDemand => {
                    const freed = shouldWait ? await toWait : null

                    resolveUsageDemand()
                    notify(messages.START, freed)

                    const firstNotUsed = this.poll.find(({ inUse }) => !inUse)
                    if (firstNotUsed) {
                      firstNotUsed.inUse = true
                      resolveDemand()

                      resolveItem({
                        item: firstNotUsed.content,
                        release: () => {
                          firstNotUsed.inUse = false

                          resolveUsage()
                        },
                      })
                    } else {
                      const item = createItem()
                      item.inUse = true

                      this.poll.push(item)
                      resolveDemand()

                      item.content = await this.createCold()

                      resolveItem({
                        item: item.content,
                        release: () => {
                          this.poll.splice(this.poll.indexOf(item), 1)

                          resolveUsage()
                        },
                      })
                    }
                  }),
              )
            }).then(() => {
              const index = this.usagePoll.indexOf(usagePromise)
              if (index > -1) {
                this.usagePoll.splice(index, 1)
              }
              return notify(messages.REMOVE)
            })

            this.usagePoll.push(usagePromise)
          }),
      ),
    )
  }
}
