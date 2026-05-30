export const STATIONARY_SPEED_THRESHOLD = 0.005

export const motionStateForSpeed = (speed = 0) => {
  if (Math.abs(speed) <= STATIONARY_SPEED_THRESHOLD) return 'stationary'
  return speed < 0 ? 'retrograde' : 'direct'
}

export const motionMarker = (position = {}) => {
  if (position.motion === 'stationary' || position.stationary) return 'E'
  return position.retrograde ? 'R' : ''
}
