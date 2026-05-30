const SOURCE_SCALE = 0.42
const SOURCE_OFFSET_X = -146.6
const SOURCE_OFFSET_Y = -64

const sourceCenterPaths = {
  Head: 'M1122.594,193.576 c19.709,30.77,3.73,55.714-35.688,55.715l-80.596,0.004c-9.854,0-25.832,0-35.687,0l-80.596-0.004 c-39.418-0.001-55.396-24.945-35.688-55.715l40.295-62.911c4.927-7.692,12.915-20.163,17.843-27.855l40.301-62.907 c19.711-30.769,51.668-30.769,71.379,0l40.3,62.907c4.928,7.692,12.917,20.163,17.844,27.855L1122.594,193.576z',
  Ajna: 'M854.339,356.152 c-19.708-30.77-3.729-55.714,35.688-55.715l80.596-0.003c9.854-0.001,25.832-0.001,35.687,0l80.596,0.003 c39.419,0.001,55.397,24.945,35.688,55.715l-40.294,62.911c-4.928,7.692-12.916,20.163-17.844,27.855l-40.301,62.908 c-19.711,30.768-51.667,30.768-71.378,0l-40.301-62.908c-4.928-7.692-12.916-20.163-17.844-27.855L854.339,356.152z',
  Throat: 'M1105.542,807.801 c-0.001,29.746-22.378,53.859-49.982,53.86l-47.721,0.001c-11.042,0.001-28.943,0.001-39.984,0l-47.721-0.001 c-27.604-0.001-49.981-24.114-49.982-53.86l-0.001-51.422c-0.001-11.898-0.001-31.188,0-43.087l0.001-51.423 c0.001-29.745,22.378-53.858,49.982-53.859l47.721-0.001c11.041-0.001,28.942-0.001,39.984,0l47.721,0.001 c27.604,0.001,49.981,24.114,49.982,53.859l0.001,51.423c0.001,11.898,0.001,31.188,0,43.087L1105.542,807.801z',
  G: 'M1023.042,1203.557 c-19.519,19.518-51.165,19.517-70.685-0.002l-33.744-33.743c-7.808-7.808-20.466-20.466-28.273-28.273l-33.742-33.745 c-19.519-19.521-19.519-51.167-0.001-70.686l33.742-33.744c7.807-7.807,20.465-20.465,28.272-28.272l33.744-33.741 c19.519-19.519,51.164-19.518,70.684,0.001l33.745,33.743c7.808,7.808,20.466,20.466,28.272,28.274l33.743,33.745 c19.519,19.52,19.519,51.166,0.001,70.685l-33.742,33.744c-7.807,7.808-20.465,20.466-28.272,28.272L1023.042,1203.557z',
  Ego: 'M1364.791,1286.496 c11.264,24.11-3.228,39.686-32.368,34.789l-60.875-10.229c-7.377-1.239-19.338-3.25-26.715-4.49l-61.13-10.276 c-29.14-4.898-38.271-24.444-20.396-43.657l37.34-40.135c4.525-4.864,11.862-12.75,16.389-17.613l37.5-40.302 c17.877-19.211,41.501-15.241,52.767,8.868l23.534,50.365c2.852,6.104,7.476,15.999,10.327,22.104L1364.791,1286.496z',
  'Solar Plexus': 'M1509.455,1362.758c30.77-19.708,55.714-3.729,55.715,35.689l0.003,80.596c0.001,9.854,0.001,25.832,0,35.687l-0.003,80.595 c-0.001,39.419-24.945,55.397-55.715,35.689l-62.911-40.295c-7.692-4.927-20.163-12.915-27.855-17.843l-62.908-40.301 c-30.768-19.711-30.768-51.668,0-71.379l62.908-40.3c7.692-4.928,20.163-12.917,27.855-17.844L1509.455,1362.758z',
  Spleen: 'M466.328,1362.758c-30.77-19.708-55.713-3.729-55.715,35.689l-0.003,80.596c0,9.854,0,25.832,0,35.687l0.003,80.595 c0.001,39.419,24.945,55.397,55.715,35.689l62.911-40.295c7.692-4.927,20.164-12.915,27.855-17.843l62.908-40.301 c30.768-19.711,30.768-51.668,0-71.379l-62.908-40.3c-7.692-4.928-20.163-12.917-27.855-17.844L466.328,1362.758z',
  Sacral: 'M1105.542,1585.162 c-0.001,27.972-22.378,50.647-49.982,50.648l-47.721,0.001c-11.042,0.001-28.943,0.001-39.984,0l-47.721-0.001 c-27.604-0.001-49.981-22.677-49.982-50.648l-0.001-48.356c-0.001-11.189-0.001-29.329,0-40.518l0.001-48.356 c0.001-27.973,22.378-50.648,49.982-50.648l47.721-0.002c11.041,0,28.942,0,39.984,0l47.721,0.002 c27.604,0,49.981,22.676,49.982,50.648l0.001,48.356c0.001,11.188,0.001,29.328,0,40.518L1105.542,1585.162z',
  Root: 'M1105.542,1903.162 c-0.001,27.972-22.378,50.647-49.982,50.648l-47.721,0.001c-11.042,0.001-28.943,0.001-39.984,0l-47.721-0.001 c-27.604-0.001-49.981-22.677-49.982-50.648l-0.001-48.356c-0.001-11.189-0.001-29.329,0-40.518l0.001-48.356 c0.001-27.973,22.378-50.648,49.982-50.648l47.721-0.002c11.041,0,28.942,0,39.984,0l47.721,0.002 c27.604,0,49.981,22.676,49.982,50.648l0.001,48.356c0.001,11.188,0.001,29.328,0,40.518L1105.542,1903.162z',
}

const commandArgs = {
  M: ['point'],
  L: ['point'],
  H: ['x'],
  V: ['y'],
  C: ['point', 'point', 'point'],
  S: ['point', 'point'],
  Q: ['point', 'point'],
  T: ['point'],
  A: ['rx', 'ry', 'raw', 'flag', 'flag', 'point'],
  Z: [],
}

const fmt = value => Number.parseFloat(value.toFixed(3)).toString()
const absoluteX = value => fmt(value * SOURCE_SCALE + SOURCE_OFFSET_X)
const absoluteY = value => fmt(value * SOURCE_SCALE + SOURCE_OFFSET_Y)
const relative = value => fmt(value * SOURCE_SCALE)
const tokenizePath = path => path.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:e[-+]?\d+)?/gi) || []

const transformNumber = (value, type, axis, relativeCommand) => {
  if (type === 'raw' || type === 'flag') return fmt(value)
  if (type === 'rx' || type === 'ry') return relative(value)
  if (axis === 'x') return relativeCommand ? relative(value) : absoluteX(value)
  if (axis === 'y') return relativeCommand ? relative(value) : absoluteY(value)
  return fmt(value)
}

const transformPoint = (tokens, index, relativeCommand) => [
  transformNumber(Number(tokens[index]), 'x', 'x', relativeCommand),
  transformNumber(Number(tokens[index + 1]), 'y', 'y', relativeCommand),
]

const transformPath = (path) => {
  const tokens = tokenizePath(path)
  const output = []
  let index = 0
  let command = ''

  while (index < tokens.length) {
    if (/^[a-zA-Z]$/.test(tokens[index])) {
      command = tokens[index]
      output.push(tokens[index])
      index += 1
    }

    const args = commandArgs[command.toUpperCase()]
    if (!args) break
    if (args.length === 0) continue

    const relativeCommand = command === command.toLowerCase()
    while (index < tokens.length && !/^[a-zA-Z]$/.test(tokens[index])) {
      for (const arg of args) {
        if (arg === 'point') {
          output.push(...transformPoint(tokens, index, relativeCommand))
          index += 2
        } else {
          const axis = arg === 'x' ? 'x' : arg === 'y' ? 'y' : null
          output.push(transformNumber(Number(tokens[index]), arg, axis, relativeCommand))
          index += 1
        }
      }
    }
  }

  return output.join(' ')
}

export const centerShapes = Object.fromEntries(
  Object.entries(sourceCenterPaths).map(([name, d]) => [name, { d: transformPath(d) }])
)

export const centerFills = {
  Head: '#1f2025',
  Ajna: '#6fa08f',
  Throat: '#5b4039',
  G: '#fff7a8',
  Ego: '#db4f51',
  'Solar Plexus': '#d75152',
  Spleen: '#5f4339',
  Sacral: '#d84f51',
  Root: '#60473d',
}

export const centerText = {
  Head: '#b7bcc4',
  Ajna: '#dfeee9',
  Throat: '#d9c8c2',
  G: '#6f6a30',
  Ego: '#fff0ef',
  'Solar Plexus': '#ffe9e8',
  Spleen: '#dccbc6',
  Sacral: '#ffe8e7',
  Root: '#d9c7c2',
}
