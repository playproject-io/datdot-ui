localStorage.debug = '*' // to get debug output
const datdotui = require('..')
const data = {
  plans: {
    title: 'PLANS',
    tab: ['Data', 'Schedule', 'Location', 'Performance', 'Swarm']
  },
  jobs: {
    title: 'JOBS',
    tab: ['Calendar', 'Summary', 'Performance']
  }
}
const element = datdotui(data)
document.body.append(element)