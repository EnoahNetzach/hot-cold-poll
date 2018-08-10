import Square from './Square'

const timeout = delay => new Promise(resolve => setTimeout(resolve, delay))

export const messages = {
  CLOSE: 'CLOSE',
  CREATE: 'CREATE',
  FINISH: 'FINISH',
  OPEN: 'OPEN',
  USE: 'USE',
}

export default function(View, notify = () => {}) {
  let totalSquareNumber = 0

  return async () => {
    await timeout(100)
    const square = new Square(View, totalSquareNumber++)

    notify(messages.CREATE, square.id)

    await timeout(100)

    await square.open()

    notify(messages.OPEN, square.id)

    const use = async pid => {
      const duration = Math.round(Math.random() * 5000 + 2000)

      await square.use(pid, duration)

      notify(messages.USE, square.id)

      await timeout(duration)

      await square.unuse()

      notify(messages.FINISH, square.id)
    }

    const close = async () => {
      await timeout(200)
      await square.close()

      notify(messages.CLOSE, square.id)
    }

    return { close, use }
  }
}
