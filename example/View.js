const container = document.createElement('div')
container.className = 'grid'
document.getElementById('app').appendChild(container)

export default container

let demand = 0
const demandEl = document.createElement('h4')
demandEl.className = 'demand'
container.appendChild(demandEl)

export function updateDemand(update) {
  demand += update

  demandEl.innerText = `Demand: ${demand}`
}
updateDemand(0)

const stopDemandEl = document.createElement('button')
stopDemandEl.innerText = 'STOP DEMAND'
stopDemandEl.className = 'stopDemand'
document.getElementById('app').appendChild(stopDemandEl)

export function registerOnStopDemand(onStopDemand) {
  const callback = () => {
    stopDemandEl.removeEventListener('click', callback)
    stopDemandEl.innerText = 'DEMAND STOPPED'
    stopDemandEl.className = 'demandStopped'

    onStopDemand()
  }

  stopDemandEl.addEventListener('click', callback)
}

let start
let last
export function createTimeSlice(reason, clone = true) {
  if (!start) {
    start = new Date().getTime()
    last = start
  }
  const now = new Date().getTime()
  const delta = now - last
  last = now

  const sliceEl = document.createElement('div')
  sliceEl.className = 'slice'

  const reasonEl = document.createElement('h5')
  reasonEl.innerText = reason
  reasonEl.className = 'reason'
  sliceEl.appendChild(reasonEl)

  const timestampEl = document.createElement('small')
  timestampEl.innerText = `@ ${now - start}ms (+ ${delta}ms)`
  timestampEl.className = 'timestamp'
  reasonEl.appendChild(document.createElement('br'))
  reasonEl.appendChild(timestampEl)

  if (clone) {
    sliceEl.appendChild(container.cloneNode(true))
  }

  container.after(sliceEl)
}
