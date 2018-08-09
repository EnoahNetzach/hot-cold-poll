import ChainPoll from './ChainPoll'
import HotColdPoll from './HotColdPoll'
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

  createTimeSlice(`new Square #${id}`)

  const reset = () =>
    new Promise(resolve => {
      square.free = resolve
    }).then(() => freePoll(square, reset))

  reset()

  await timeout(200)

  await square.original.open()

  return square
}

async function use(square, pid) {
  const duration = Math.round(Math.random() * 5000 + 2000)

  square.inUse = true
  square.original.use(pid, duration)

  createTimeSlice(`use Square #${square.original.id}`)

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
  await timeout(500)
  await square.original.close()
}

async function run() {
  const poll = new HotColdPoll({
    createLongLiving: () =>
      createSquare(totalSquareNumber++, (square, reset) => {
        unuse(square)
        reset()

        createTimeSlice(`free long living Square #${square.original.id}`)
      }),
    createShortLiving: () =>
      createSquare(totalSquareNumber++, square => {
        remove(square)

        createTimeSlice(`free short living Square #${square.original.id}`)
      }),
    maxSize: 50,
    minSize: 5,
  })

  let squareUid = 0

  await poll.init()

  const demandPoll = new ChainPoll(async () => {
    await timeout(200)

    const pid = squareUid++
    const { item: square, release } = await poll.get()

    if (!square) {
      return
    }

    use(square, pid).then(release)
    updateDemand(-1)

    createTimeSlice('decrease demand -1', false)

    await timeout(200)
  })

  const demandInterval = setInterval(() => {
    const demandUpdate = Math.round(Math.random() * 10)
    updateDemand(demandUpdate)

    Array.from({ length: demandUpdate }).forEach(() => demandPoll.demand())
  }, 2000)

  registerOnStopDemand(() => {
    clearInterval(demandInterval)

    createTimeSlice('stop demand', false)
  })

  // for (let i = 0; i < 10; i++) {
  //   updateDemand(1)
  //   demandPoll.demand()

  //   createTimeSlice('increase demand +1', false)
  //   // await timeout(50)
  // }
}

run()
