<script setup>
const centerX            = 260
const topY               = -58
const shoulderY          = 426
const lowerSideY         = 662
const rootBottomY        = 735
const bottomPadding      = 94
const arcY               = rootBottomY + bottomPadding
const shoulderHalfWidth  = 246
const lowerSideHalfWidth = 270

const point = (x, y) => `${x} ${y}`
const left  = distance => centerX - distance
const right = distance => centerX + distance

const figurePath = [
  `M${point(centerX, topY)}`,
  `C${point(right(96), 54)} ${point(right(172), 226)} ${point(right(shoulderHalfWidth), shoulderY)}`,
  `C${point(right(282), 514)} ${point(right(306), 606)} ${point(right(lowerSideHalfWidth), lowerSideY)}`,
  `Q${point(centerX, arcY)} ${point(left(lowerSideHalfWidth), lowerSideY)}`,
  `C${point(left(306), 606)} ${point(left(282), 514)} ${point(left(shoulderHalfWidth), shoulderY)}`,
  `C${point(left(172), 226)} ${point(left(96), 54)} ${point(centerX, topY)}`,
  'Z',
].join(' ')

defineProps({
  fill:    { type: String, default: '#3b3b3e' },
  opacity: { type: Number, default: 0.66 },
})
</script>

<template lang="pug">
path(:d='figurePath' :fill='fill' :opacity='opacity')
</template>
