import Chart from 'chart.js'

const statistics = document.getElementById('statistics')

const mirror = document.createElement('div')
mirror.className = 'mirror'
statistics.appendChild(mirror)

const container = document.createElement('div')
container.className = 'container'
mirror.appendChild(container)

function getChart(name, time = false) {
  const chartEl = document.createElement('canvas')
  container.appendChild(chartEl)

  const startingTime = new Date()

  const chart = new Chart(chartEl, {
    type: 'line',
    data: {
      labels: [time ? startingTime : 0],
      datasets: [
        {
          backgroundColor: 'red',
          borderColor: 'red',
          data: [0],
          fill: false,
          label: 'value',
          lineTension: 0,
        },
        {
          backgroundColor: 'blue',
          borderColor: 'blue',
          data: [0],
          fill: false,
          label: 'mean',
          lineTension: 0,
        },
        {
          backgroundColor: 'green',
          borderColor: 'green',
          data: [0],
          fill: false,
          label: ' moving mean',
          lineTension: 0,
        },
      ],
    },
    options: {
      animation: {
        duration: 0,
      },
      hover: {
        animationDuration: 0,
      },
      responsive: true,
      responsiveAnimationDuration: 0,
      scales: {
        xAxes: [
          {
            type: time ? 'time' : undefined,
            scaleLabel: {
              display: false,
            },
          },
        ],
        yAxes: [
          {
            display: true,
            scaleLabel: {
              display: false,
            },
          },
        ],
      },
      title: {
        display: true,
        text: name,
      },
    },
  })

  return (passedValue, increment = false) => {
    const newValue = increment ? chart.data.datasets[0].data.slice(-1)[0] + passedValue : passedValue

    const numOfValues = chart.data.labels.length

    chart.data.labels.push(time ? new Date() : numOfValues)

    // values
    chart.data.datasets[0].data.push(newValue)

    // means
    const [lastMean] = chart.data.datasets[1].data.slice(-1)
    chart.data.datasets[1].data.push((lastMean * numOfValues + newValue) / (numOfValues + 1))

    // moving means
    const lastValues = chart.data.datasets[0].data.slice(-5)
    chart.data.datasets[2].data.push(lastValues.reduce((tot, demand) => tot + demand, 0) / lastValues.length)

    chart.update()
  }
}

export const updateDemandChart = getChart('Demand', true)

export const updateSpotUsageChart = getChart('Spot usage', true)

export const updateWaitingTimeChart = getChart('Waiting time', true)

export const updateUsageTimeChart = getChart('Usage time', true)
