<template lang="pug">
.app-logo.inline-flex.items-center.gap-2(aria-label='Astrelio')
  svg.logo-mark(width='34' height='34' viewBox='0 0 34 34' role='img' aria-hidden='true')
    circle(cx='17' cy='17' r='14.5' fill='none' stroke='currentColor' stroke-width='1.8')
    circle(cx='17' cy='17' r='7.5' fill='none' stroke='currentColor' stroke-width='1.2' opacity='0.72')
    path(d='M17 2.5v5.1M17 26.4v5.1M2.5 17h5.1M26.4 17h5.1' stroke='currentColor' stroke-width='1.4' stroke-linecap='round')
    path(d='M7.1 7.1l3.2 3.2M23.7 23.7l3.2 3.2M26.9 7.1l-3.2 3.2M10.3 23.7l-3.2 3.2' stroke='currentColor' stroke-width='1.1' stroke-linecap='round' opacity='0.68')
    path(d='M17 10.2l1.8 4.7 5 .3-3.9 3.1 1.2 4.9-4.1-2.7-4.1 2.7 1.2-4.9-3.9-3.1 5-.3L17 10.2z' fill='currentColor')
  span.logo-word Astrelio
</template>

<style scoped>
.app-logo { color: rgb(252 211 77); }
.logo-mark { flex: 0 0 auto; filter: drop-shadow(0 0 10px rgba(252, 211, 77, 0.16)); }
.logo-word {
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1;
}
</style>
