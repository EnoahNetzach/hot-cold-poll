import Chart from 'chart.js'

const statistics = document.getElementById('statistics')

const mirror = document.createElement('div')
mirror.className = 'mirror'
statistics.appendChild(mirror)

const container = document.createElement('div')
container.className = 'container'
mirror.appendChild(container)

const demandChartEl = document.createElement('canvas')
container.appendChild(demandChartEl)

function getChart(name) {
  const chartEl = document.createElement('canvas')
  container.appendChild(chartEl)

  const chart = new Chart(chartEl, {
    type: 'line',
    data: {
      labels: [0],
      datasets: [
        {
          backgroundColor: 'red',
          borderColor: 'red',
          data: [0],
          fill: false,
          label: 'value',
        },
        {
          backgroundColor: 'blue',
          borderColor: 'blue',
          data: [0],
          fill: false,
          label: 'mean',
        },
        {
          backgroundColor: 'green',
          borderColor: 'green',
          data: [0],
          fill: false,
          label: ' moving mean',
        },
      ],
    },
    options: {
      responsive: true,
      title: {
        display: true,
        text: name,
      },
      scales: {
        xAxes: [
          {
            display: true,
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
    },
  })

  return newValue => {
    const numOfValues = chart.data.labels.length

    chart.data.labels.push(numOfValues)

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

export const updateDemandChart = getChart('Demand')
