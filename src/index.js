import ChainPoll from './ChainPoll'
import HotColdPoll, { messages } from './HotColdPoll'
import Square from './Square'
import View, { createTimeSlice, registerOnStopDemand, updateDemand } from './View'

const timeout = delay => new Promise(resolve => setTimeout(resolve, delay))

let totalSquareNumber = 0

const createSquare = async (id, freePoll = (square, reset) => reset()) => {
  let square = {
    free: () => {},
    inUse: false,
    original: new Square(View, id),
  }

  createTimeSlice(`new square #${id}`)

  const reset = () =>
    new Promise(resolve => {
      square.free = resolve
    }).then(() => freePoll(square, reset))

  reset()

  await timeout(200)

  await square.original.open()

  createTimeSlice(`open square #${id}`)

  return square
}

async function use(square, pid) {
  const duration = Math.round(Math.random() * 5000 + 2000)

  square.inUse = true
  square.original.use(pid, duration)

  createTimeSlice(`use square #${square.original.id}`)

  await timeout(duration)
  square.free()
}

function unuse(square) {
  square.inUse = false
  square.original.unuse()
}

async function remove(square) {
  square.inUse = false
  square.original.unuse()
  // await timeout(500)
  await square.original.close()
}

async function run() {
  const poll = new HotColdPoll({
    createCold: () =>
      createSquare(totalSquareNumber++, square => {
        remove(square)

        createTimeSlice(`free cold square #${square.original.id}`)
      }),
    createHot: () =>
      createSquare(totalSquareNumber++, (square, reset) => {
        unuse(square)
        reset()

        createTimeSlice(`free hot square #${square.original.id}`)
      }),
    maxSize: 15,
    minSize: 5,
  })

  let squareUid = 0

  await poll.init()

  const demandPoll = new ChainPoll(async () => {
    await timeout(200)

    const pid = squareUid++
    const { item: square, release } = await poll.get((message, ...args) => {
      switch (message) {
        case messages.BLOCK: {
          const [inUse, max, before] = args
          createTimeSlice(`enter demand ${pid} BLOCK [${inUse} / ${max}] (${before} before)`)
          break
        }
        case messages.GO: {
          const [inUse, max] = args
          createTimeSlice(`enter demand ${pid} GO [${inUse} / ${max}]`, false)
          break
        }
        case messages.REMOVE:
          createTimeSlice(`remove promise ${pid}`, false)
          break
        case messages.START: {
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

    use(square, pid).then(release)
    updateDemand(-1)

    createTimeSlice('decrease demand -1', false)

    await timeout(200)
  })

  const demandInterval = setInterval(() => {
    const demandUpdate = Math.round(Math.random() * 20)
    updateDemand(demandUpdate)

    Array.from({ length: demandUpdate }).forEach(() => demandPoll.demand())
  }, 2000)

  registerOnStopDemand(() => {
    clearInterval(demandInterval)

    createTimeSlice('stop demand', false)
  })
}

// run()
