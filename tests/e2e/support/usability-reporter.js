import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

// Aggregates the 'usability' attachments (see support/usability.js) into ISO 9241-11 reports per context of use.
// Satisfaction columns are proxy scores only; they do not replace questionnaires such as SUS.

const mean = (values, digits = 2) => values.length ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(digits)) : 0
const table = (header, rows) => [header, header.map(() => '---'), ...rows].map(row => `| ${row.join(' | ')} |`).join('\n')
const pad = (value, width) => String(value).padEnd(width)

const summarize = (tasks) => ({
  tasks:                  tasks.length,
  completionRate:         mean(tasks.map(task => task.effectiveness.completed ? 100 : 0), 1),
  meanRelativeEfficiency: mean(tasks.map(task => task.efficiency.relativeEfficiency)),
  meanTimeMs:             mean(tasks.map(task => task.efficiency.totalMs), 0),
  meanProxyScore:         mean(tasks.map(task => task.satisfactionProxies.score), 1),
})

const taskRow = task => [
  task.id, task.user, task.effectiveness.completed ? 'yes' : 'NO', task.effectiveness.errors,
  `${task.efficiency.actions}/${task.efficiency.optimalActions}`, task.efficiency.relativeEfficiency, task.efficiency.totalMs,
  task.satisfactionProxies.score,
]
const taskHeader = ['task', 'user', 'completed', 'errors', 'actions/optimal', 'rel. efficiency', 'ms', 'proxy score']

const markdown = (contexts) => [
  '# Usability report (ISO 9241-11)',
  '',
  'Effectiveness: completion and errors. Efficiency: actions vs optimal, time on task. Satisfaction: objective proxies only (not user-reported; use SUS or similar for real satisfaction).',
  '',
  '## Summary per context of use',
  table(['context', 'viewport', 'tasks', 'completion %', 'mean rel. efficiency', 'mean ms', 'mean proxy score'],
    contexts.map(({ project, viewport, summary }) => [project, `${viewport.width}x${viewport.height}`, summary.tasks, summary.completionRate, summary.meanRelativeEfficiency, summary.meanTimeMs, summary.meanProxyScore])),
  ...contexts.flatMap(({ project, tasks }) => [
    '', `## ${project}`, table(taskHeader, tasks.map(taskRow)),
    ...tasks.flatMap(task => task.satisfactionProxies.checks.filter(check => check.applicable && !check.pass)
      .map(check => `- ${task.id}: proxy failed, ${check.label} (${check.value})`)),
  ]),
  '',
].join('\n')

export default class UsabilityReporter {
  constructor(options = {}) {
    this.options = options
    this.tasks   = new Map()
  }

  onBegin(config) {
    this.outputDir = this.options.outputDir || join(dirname(config.configFile), 'test-results', 'usability')
  }

  onTestEnd(test, result) {
    const attachment = result.attachments.find(item => item.name === 'usability' && item.body)
    if (attachment) this.tasks.set(test.id, JSON.parse(attachment.body.toString()))
  }

  onEnd() {
    if (!this.tasks.size) return
    const byProject = Map.groupBy([...this.tasks.values()], task => task.context.project)
    const contexts  = [...byProject].map(([project, tasks]) => {
      tasks.sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }))
      return { project, viewport: tasks[0].context.viewport, summary: summarize(tasks), tasks }
    })

    mkdirSync(this.outputDir, { recursive: true })
    writeFileSync(join(this.outputDir, 'report.json'), `${JSON.stringify({ standard: 'ISO 9241-11', satisfaction: 'proxies', contexts }, null, 2)}\n`)
    writeFileSync(join(this.outputDir, 'report.md'), markdown(contexts))
    console.log(this.compact(contexts))
  }

  compact(contexts) {
    const lines = contexts.flatMap(({ project, summary, tasks }) => [
      `\nUsability ${project}: completion ${summary.completionRate}%  rel.eff ${summary.meanRelativeEfficiency}  proxy ${summary.meanProxyScore}  (proxies, not satisfaction)`,
      `  ${pad('task', 5)}${pad('done', 6)}${pad('err', 5)}${pad('act/opt', 9)}${pad('ms', 7)}proxy`,
      ...tasks.map(task => `  ${pad(task.id, 5)}${pad(task.effectiveness.completed ? 'yes' : 'NO', 6)}${pad(task.effectiveness.errors, 5)}${pad(`${task.efficiency.actions}/${task.efficiency.optimalActions}`, 9)}${pad(task.efficiency.totalMs, 7)}${task.satisfactionProxies.score}`),
    ])
    return `${lines.join('\n')}\n`
  }
}
