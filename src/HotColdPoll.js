import ChainPoll from './ChainPoll'

function createItem(content, shouldBeKilled = false) {
  return {
    closingTimeout: null,
    content,
    inUse: false,
    shouldBeKilled,
  }
}

export const messages = {
  BLOCK: 'BLOCK',
  GO: 'GO',
  REMOVE: 'REMOVE',
  REUSE: 'REUSE',
  START: 'START',
}

export default class {
  constructor({ createSpot, maxSize, minSize, retentionDelay = 0 }) {
    this.createSpot = createSpot
    this.maxSize = Math.max(1, Math.max(minSize, maxSize))
    this.minSize = minSize
    this.retentionDelay = retentionDelay

    this.poll = []
    this.waitPoll = new ChainPoll()
    this.usagePoll = []
    this.waitUsagePoll = new ChainPoll()
  }

  async init() {
    this.poll.push(
      ...(await Promise.all(Array.from({ length: this.minSize }).map(async () => createItem(await this.createSpot())))),
    )
  }

  async get(notify = () => {}) {
    return new Promise(resolveItem =>
      // waitPoll locks on until the current demand has gotten a spot to use
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

                    let item = this.poll.find(({ inUse }) => !inUse)

                    if (item) {
                      if (item.closingTimeout !== null) {
                        notify(messages.REUSE)

                        clearTimeout(item.closingTimeout)
                        item.closingTimeout = null
                      }

                      item.inUse = true
                      resolveDemand()
                    } else {
                      item = createItem(null, true)
                      item.inUse = true

                      this.poll.push(item)
                      resolveDemand()

                      item.content = await this.createSpot()
                    }

                    resolveItem({
                      item: item.content,
                      release: (close = () => {}) => {
                        item.inUse = false

                        resolveUsage()

                        if (item.shouldBeKilled) {
                          const kill = () => {
                            this.poll.splice(this.poll.indexOf(item), 1)
                            close()
                          }

                          if (this.retentionDelay > 0) {
                            item.closingTimeout = setTimeout(kill, this.retentionDelay)
                          } else {
                            kill()
                          }
                        }
                      },
                    })
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
