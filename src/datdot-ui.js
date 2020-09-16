const debug = require('debug')
const bel = require('bel')
const csjs = require('csjs-inject')
const tab = require('datdot-ui-tab')

module.exports = datdotui

function datdotui (opts) {

  const { jobs } = opts
  let state = {}

  const element = bel`
  <div>
    ${tab({page: jobs.title, arr: jobs.tab, protocol: protocolTab})}
    <div class=${css.terminal}></div>
  </div>
  `
  const [tabs, terminal] = element.children
 
  function protocolTab(message) {
    let { from, flow, type, body, active} = message
    const log = debug(from)
    const logger = log.extend('datdot-ui')
    // logger.log must be put first then logger()
    logger.log = domlog
    logger(message)
  
    if ( state.tab == undefined ) state.tab = new Array()

    const found = state.tab.some( el => el.body === body)
    if (!found) state.tab.push( {id: `datdot-ui-${`${Math.random()}`.slice(2)}`, from, flow, type, body, active, logger} )

    state.tab.map( el => { 
      if ( el.body === body && el.active ) return
      el.body !== body ? el.active = false : el.active = true 
    })
    
    // check state 
    const tabChanges = log.extend('ui-tab changes')
    tabChanges(state.tab)
    
    return receive(message)
  }

  function receive(message) {
    const { from, flow, type, body, active} = message
    const log = debug(from)
    const logger = log.extend('receive>')
    logger(flow, type, body, active)
  }

  function domlog(...args) {
    const {from, flow, type, body} = args[3]
    const el = bel`<p>${from + " > "}  ${flow}: ${body} ${type}</p>`
    terminal.append(el)
  }

  return element

}
const css = csjs`
body { 
  margin: 0;
  padding: 0;
  background-color: #F2F2F2;
}
.terminal {

}
`
