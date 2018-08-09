import HotColdPoll from './HotColdPoll'

const timeout = delay => new Promise(resolve => setTimeout(resolve, delay))

describe.skip('HotColdPoll', () => {
  let poll
  let longLiving = []
  let shortLiving = []
  let items = []

  const getPoll = (longLivingDelays = [], shortLivingDelays = []) =>
    new HotColdPoll({
      createLongLiving: async () => {
        await timeout(longLivingDelays.pop() || 0)

        longLiving.push(1)

        return 1
      },
      createShortLiving: async () => {
        await timeout(shortLivingDelays.pop() || 0)

        shortLiving.push(2)

        return 2
      },
      minSize: 3,
      maxSize: 7,
    })

  afterEach(() => {
    longLiving = []
    shortLiving = []
    items = []
  })

  test('inits the poll', async () => {
    const poll = getPoll()

    const initPromise = poll.init()
    expect(longLiving.length).toBe(0)
    await initPromise
    expect(longLiving.length).toBe(3)
  })

  test('uses the hot spots available first', async () => {
    const poll = getPoll()
    await poll.init()

    await Promise.all(
      Array.from({ length: 5 }).map(() =>
        poll.get().then(async ({ item, release }) => {
          items.push(item)

          await timeout(0)

          release()
        }),
      ),
    )

    expect(longLiving.length).toBe(3)
    expect(shortLiving.length).toBe(2)
    expect(items).toEqual([1, 1, 1, 2, 2])
  })

  test('reuses released hot spots', async () => {
    const releases = []
    const poll = getPoll()
    await poll.init()

    await Promise.all(
      [0, 200, 200].map(delay =>
        poll.get().then(async ({ item, release }) => {
          items.push(item)

          timeout(delay)
            .then(release)
            .then(() => releases.push(1))
        }),
      ),
    )

    await timeout(100)

    await Promise.all(
      [0, 0].map(delay =>
        poll.get().then(async ({ item, release }) => {
          items.push(item)

          timeout(delay)
            .then(release)
            .then(() => releases.push(2))
        }),
      ),
    )

    await timeout(300)

    expect(longLiving.length).toBe(3)
    expect(shortLiving.length).toBe(1)
    expect(items).toEqual([1, 1, 1, 1, 2])
    expect(releases).toEqual([1, 2, 2, 1, 1])
  })

  test('awaits for a free spot', async () => {
    const poll = getPoll()
    await poll.init()

    await Promise.all(
      Array.from({ length: 7 }).map(() =>
        poll.get().then(async ({ item, release }) => {
          console.log(item)
          items.push(item)

          timeout(200).then(release)
        }),
      ),
    )

    poll.get().then(async ({ item, release }) => {
      console.log(item)
      items.push(item)

      await timeout(100)

      release()
    })

    expect(longLiving.length).toBe(3)
    expect(shortLiving.length).toBe(4)

    expect(items).toEqual([1, 1, 1, 2, 2, 2, 2])

    await timeout(400)

    expect(items).toEqual([1, 1, 1, 2, 2, 2, 2, 1])
  })
})
