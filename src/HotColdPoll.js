import ChainPoll from './ChainPoll'
import { createTimeSlice } from './View'

function createItem(content) {
  return {
    content,
    inUse: false,
  }
}

let uuid = 0

export default class {
  constructor({ createLongLiving, createShortLiving, maxSize, minSize }) {
    this.createLongLiving = createLongLiving
    this.createShortLiving = createShortLiving
    this.maxSize = Math.max(1, Math.max(minSize, maxSize))
    this.minSize = minSize

    this.poll = []
    this.waitPoll = new ChainPoll()
    this.usagePoll = []
    this.waitUsagePoll = new ChainPoll()
  }

  async init() {
    this.poll.push(
      ...(await Promise.all(
        Array.from({ length: this.minSize }).map(async () => createItem(await this.createLongLiving())),
      )),
    )
  }

  async get() {
    const tuuid = uuid++
    return new Promise(resolveItem =>
      this.waitPoll.demand(
        () =>
          new Promise(resolveDemand => {
            const usagePromise = new Promise(async resolveUsage => {
              this.waitUsagePoll.demand(
                () =>
                  new Promise(async resolveUsageDemand => {
                    const shouldWait = this.poll.filter(({ inUse }) => inUse).length >= this.maxSize
                    createTimeSlice(
                      `enter ${tuuid} ${shouldWait ? 'BLOCKED' : 'GO'} [${
                        this.poll.filter(({ inUse }) => inUse).length
                      } / ${this.maxSize}]`,
                      shouldWait,
                    )

                    const toWait = [...this.usagePoll]
                    if (shouldWait) {
                      await Promise.race(toWait)
                    }

                    createTimeSlice(`resolve ${tuuid}`, false)
                    resolveUsageDemand()

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

                      item.content = await this.createShortLiving()

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
            }).then(() => this.usagePoll.splice(this.usagePoll.indexOf(usagePromise), 1))

            this.usagePoll.push(usagePromise)
          }),
      ),
    )
  }
}
