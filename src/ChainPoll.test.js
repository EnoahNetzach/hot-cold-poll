import ChainPoll from './ChainPoll'

const timeout = delay => new Promise(resolve => setTimeout(resolve, delay))

describe('ChainPoll', () => {
  test.only('awaits for the chain to complete before executing', async () => {
    let resolveFirstPromise
    let firstPromiseRun = false
    const firstResolutor = () =>
      new Promise(resolve => {
        resolveFirstPromise = resolve

        firstPromiseRun = true
      })

    let secondPromiseRun = false
    const secondResolutor = async () => {
      secondPromiseRun = true
    }

    const poll = new ChainPoll()

    const firstDemand = poll.demand(firstResolutor)
    const secondDemand = poll.demand(secondResolutor)

    expect(firstPromiseRun).toBe(false)
    expect(secondPromiseRun).toBe(false)

    await Promise.resolve()
    resolveFirstPromise()
    await firstDemand

    expect(firstPromiseRun).toBe(true)
    expect(secondPromiseRun).toBe(false)

    await secondDemand

    expect(firstPromiseRun).toBe(true)
    expect(secondPromiseRun).toBe(true)
  })

  test('awaits in the demand order', async () => {
    const results = []
    const executions = []
    const polls = []

    const poll = new ChainPoll()

    async function getPromise(id, delay, resolutorDelay) {
      polls.push(id)

      await timeout(delay)

      await poll.demand(async () => {
        executions.push(id)
        await timeout(resolutorDelay)
        results.push(id)
      })
    }

    await Promise.all([getPromise(2, 200, 300), getPromise(1, 100, 500), getPromise(3, 300, 100)])

    expect(polls).toEqual([2, 1, 3])
    expect(executions).toEqual([1, 2, 3])
    expect(results).toEqual([1, 2, 3])
  })
})
