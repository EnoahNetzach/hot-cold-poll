import ChainPoll from '../lib/ChainPoll'
import HotColdPoll, { messages as hotColdPollMessages } from '../lib/HotColdPoll'
import squareCreator, { messages as squareCreatorMessages } from './Square'
import { updateDemandChart } from './Statistics'
import View, { createTimeSlice, registerDemand, updateDemand } from './View'

const timeout = delay => new Promise(resolve => setTimeout(resolve, delay))

const createSquare = squareCreator(View, (message, id) => {
  switch (message) {
    case squareCreatorMessages.CLOSE:
      return createTimeSlice(`close square ${id}`)
    case squareCreatorMessages.CREATE:
      return createTimeSlice(`create square ${id}`)
    case squareCreatorMessages.OPEN:
      return createTimeSlice(`open square ${id}`)
    case squareCreatorMessages.USE:
      return createTimeSlice(`use square ${id}`)
  }
})

async function run() {
  const poll = new HotColdPoll({
    createSpot: createSquare,
    maxSize: 15,
    minSize: 5,
    retentionDelay: 5000,
  })

  let squareUid = 0

  await poll.init()

  const demandPoll = new ChainPoll(async () => {
    const pid = squareUid++
    const { item: square, release } = await poll.get((message, ...args) => {
      switch (message) {
        case hotColdPollMessages.BLOCK: {
          const [inUse, max, before] = args
          createTimeSlice(`enter demand ${pid} BLOCK [${inUse} / ${max}] (${before} before)`)
          break
        }
        case hotColdPollMessages.GO: {
          const [inUse, max] = args
          createTimeSlice(`enter demand ${pid} GO [${inUse} / ${max}]`, false)
          break
        }
        case hotColdPollMessages.REMOVE:
          createTimeSlice(`remove promise ${pid}`, false)
          break
        case hotColdPollMessages.REUSE:
          createTimeSlice(`reuse spot for demand ${pid}`)
          break
        case hotColdPollMessages.START: {
          const [freed] = args
          createTimeSlice(`resolve demand ${pid} (${freed === null ? 'none' : freed} freed)`, false)
          break
        }
      }

      return pid
    })

    if (!square) {
      return
    }

    square.use(pid).then(() => release(() => square.close()))
    updateDemandChart(updateDemand(-1))

    createTimeSlice('decrease demand -1', false)

    await timeout(200)
  })

  const createDemand = () => {
    const demandUpdate = Math.round(Math.random() * 4) + 1

    updateDemandChart(updateDemand(demandUpdate))

    Array.from({ length: demandUpdate }).forEach(() => demandPoll.demand())
  }
  let demandInterval

  registerDemand(
    () => {
      createDemand()
      demandInterval = setInterval(createDemand, 2000)

      createTimeSlice('start demand', false)
    },
    () => {
      clearInterval(demandInterval)

      createTimeSlice('stop demand', false)
    },
  )
}

run()
