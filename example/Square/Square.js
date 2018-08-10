const durations = []
let previousTimestamp = new Date().getTime()
setInterval(() => {
  const currentTimestamp = new Date().getTime()
  const deltaTime = currentTimestamp - previousTimestamp
  previousTimestamp = currentTimestamp

  durations.filter(({ time }) => time > 0).forEach(duration => {
    duration.time -= deltaTime

    if (duration.time >= 0) {
      duration.setTime(duration.time)
    }
  })

  durations.filter(({ time }) => time <= 0).forEach(duration => durations.splice(durations.indexOf(duration), 1))
}, 1)

export default class {
  constructor(container, id) {
    this.id = id
    this.container = container
    this.timesUsed = 0

    this.el = document.createElement('div')
    this.el.className = 'square'
    this.container.appendChild(this.el)

    this.content = document.createElement('div')
    this.content.className = 'content'
    this.el.appendChild(this.content)

    const idEl = document.createElement('span')
    idEl.innerText = id
    idEl.className = 'id'
    this.content.appendChild(idEl)

    const pidEl = document.createElement('span')
    pidEl.innerHTML = '&nbsp;'
    pidEl.className = 'pid'
    this.content.appendChild(pidEl)

    const indexEl = document.createElement('small')
    indexEl.innerText = container.querySelectorAll('.square').length
    indexEl.className = 'index'
    this.el.appendChild(indexEl)
  }

  async open() {
    this.el.classList.add('open')

    const timesUsedEl = document.createElement('small')
    timesUsedEl.className = 'times-used'
    this.el.appendChild(timesUsedEl)

    const durationEl = document.createElement('small')
    durationEl.className = 'duration'
    this.el.appendChild(durationEl)
  }

  async use(pid, duration) {
    this.el.classList.add('used')
    this.el.classList.remove('unused')

    durations.push({
      time: duration,
      setTime: time => {
        this.el.querySelector('.duration').innerText = time
      },
    })

    this.el.querySelector('.times-used').innerText = ++this.timesUsed
    this.el.querySelector('.pid').innerText = pid
    this.el.querySelector('.duration').innerText = duration
  }

  async unuse() {
    this.el.classList.add('unused')
    this.el.classList.remove('used')

    this.el.querySelector('.pid').innerHTML = '&nbsp;'
    this.el.querySelector('.duration').innerText = ''
  }

  async close() {
    this.container.removeChild(this.el)
  }
}
