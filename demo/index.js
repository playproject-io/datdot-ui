localStorage.debug = '*' // to get debug output
const datdotui = require('..')
const data = {
    jobs: {
      title: 'JOBS',
      tab: ['Calendar', 'Summary', 'Performance']
    }
  }
const element = datdotui(data)
document.body.append(element)