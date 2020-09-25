const debug = require('debug')
const bel = require('bel')
const csjs = require('csjs-inject')
// widgets
const tab = require('datdot-ui-tab')
const calendarHeader = require('datdot-ui-calendar-month')
const timelineDays = require('datdot-ui-timeline-days')

module.exports = datdotui

function datdotui (opts) {

  const { jobs, plans } = opts
  let state = {}

  let inlineDays = bel`<div class=${css['calendar-timeline-days']}>${timelineDays( {data: null, style: `${css['timeline-days']}` }, protocolTimelineDays )}</div>`
  let tableDays = bel`<div class=${css['calendar-days-wrap']}>${timelineDays( {data: null, style: `${css['timeline-days']}` }, protocolTimelineDays ) }</div>`

  const element = bel`
  <div class=${css.wrap}>
    <section class=${css["ui-widgets"]}>

      <div class=${css.tab}>
        <h2 class=${css.title}>Tab</h2>
        ${tab({page: jobs.title, arr: jobs.tab}, protocolTab)}
        ${tab({page: plans.title, arr: plans.tab}, protocolTab)}
      </div>

      <div class=${css.calendar}>
        <h2 class=${css.title}>Calendar Header</h2>
        <div class=${css["custom-wrap"]}>${calendarHeader({page: jobs.title}, protocolCalendarHeader)}</div>
        <div class=${css["calendar-fullsize"]}>${calendarHeader({page: plans.title}, protocolCalendarHeader)}</div>
      </div>

      <div class=${css.days}>
        <h2 class=${css.title}>Days</h2>
        ${inlineDays}
        ${tableDays}
      </div>

    </section>
    
    <div class=${css.terminal}> </div>
  </div>
  `
  const [section, terminal] = element.children
 
  function protocolTab(message) {
    const { from, flow, type, body, active} = message
    const log = debug(from)
    const logger = log.extend('datdot-ui')
    const tabChanges = log.extend(`${flow} changes`)
    // logger.log must be put first then logger()
    logger.log = domlog
    logger(message)


    if ( state.tabs == undefined ) state.tabs = new Array()
    const foundFrom = state.tabs.some( obj => obj.from === from )
    const foundData = state.tabs.some( obj => obj.from === from && obj.data.some( d => d.body === body ) )
    const filterFrom = state.tabs.filter( obj => obj.from === from )

    // check from if not existed then store new tab
    if ( !foundFrom ) {
      state.tabs.push( { from, data: [ {from, flow, type, body, active, logger} ] })
      return tabChanges('state', state.tabs)
    }

    // check from and data existed then only change current tab status
    if ( foundData ) {
      filterFrom.map( o => o.data.map( d => d.active = d.body === body) )
      return tabChanges('state', state.tabs)
    }

    // when data is not existed then add to data
    filterFrom.map( o => o.data.push({from, flow, type, body, active, logger}) ) 
    
    // check from existed then store current tab status
    if ( foundFrom ) {
      filterFrom.map( o => o.data.map( d => d.active = d.body === body ))
    }
    
    // check tab
    tabChanges('state', state.tabs)
    
    return receive(message)
  }

  function protocolCalendarHeader(message) {
    const { from, flow, type, body, count, month, year, days } = message
    const log = debug(from)
    const logger = log.extend('datdot-ui')
    const calenderTitleChanges = log.extend(`${flow} changes >`)
    logger.log = domlog
    logger(message)

    // check calendar
    state.calendar = Object.assign({}, message)
    calenderTitleChanges('state', `${month} ${year}`, state.calendar)
    
    const updateDays1 = timelineDays( {data: state.calendar, style: `${css['timeline-days']}`, protocol: protocolTimelineDays}, onclick )
    const updateDays2 = timelineDays( {data: state.calendar, style: `${css['timeline-days']}`, protocol: protocolTimelineDays}, onclick )
    const timeline = document.querySelector(`.${css['calendar-timeline-days']}`)
    const table = document.querySelector(`.${css['calendar-days-wrap']}`)
    timeline.innerHTML = ''
    table.innerHTML = ''
    timeline.append(updateDays1)
    table.append(updateDays2)
    
    return receive(message)
  }

  function onclick(message){
    console.log('protocol onclick', message)
  }
  
  function protocolTimelineDays(message){
    const { from, flow, type, body, count, month, year, days} = message
    const log = debug(from)
    const logger = log.extend('timeline-days')
    logger(`${type} day ${body}`, message) 
  }

  function receive(message) {
    if ( message.active) {
      const { from, flow, type, body, active} = message
      const log = debug(from)
      const logger = log.extend('receive >')
      logger(flow, type, body, active)
    }

   if ( message.month ) {
      const { from, flow, type, body, count, month, year, days} = message
      const log = debug(from)
      const logger = log.extend('receive >')
      logger(flow, type, body, `${month} ${year}, ${days} days`)
   }
   
  }

  function domlog(...args) {
    // console.log(args[3]);
    const {from, flow, type, body} = args[3]
    const el = bel`<div>${from + " > "}  ${flow}: ${body} ${type}</div>`
    terminal.insertBefore(el, terminal.firstChild)
  }

  return element

}
const css = csjs`
body {
  margin: 0;
  padding: 0;
  font-family: Arial, Helvetica, sans-serif;
  background-color: #F2F2F2;
  height: 100%;
}
.wrap {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 75vh 25vh;
  min-width: 520px
}
.terminal {
  background-color: #212121;
  color: #f2f2f2;
  font-size: 13px;
  padding: 0 20px;
  overflow-y: auto;
}
.terminal div {
  margin: 10px 0;
}
.terminal div:first-child {
  color: #FFF500;
  font-weight: bold;
}
.ui-widgets {
  padding: 20px;
  overflow-y: auto;
}
.ui-widgets > div {
  margin-bottom: 30px;
  padding: 10px 20px 20px 20px;
  background-color: #fff;
}
.tab > nav {
  margin-bottom: 20px;
}
.title {
  color: #4BAFFF;
}
.calendar {
}
.custom-wrap {
  background-color: #f2f2f2;
  max-width: 25%;
  min-width: 225px;
  border-radius: 50px;
}
.custom-wrap > [class^="calendar-header"] {
  grid-template-rows: 30px;
}
.custom-wrap > [class^="calendar-header"] h3 {
  font-size: 16px;
}
.calendar-fullsize {
}
.days {

}
.calendar-timeline-days {

}
.timeline-days {
  display: grid;
  grid-template-rows: auto;
  grid-template-columns: repeat(auto-fit, minmax(30px, auto));
  justify-content: left;
  align-items: center;
}
.calendar-days-wrap {
  max-width: 210px;
}
.calendar-days {
  display: grid;
  grid-template-rows: auto;
  grid-template-columns: repeat(7, minmax(30px, auto));
  justify-items: center;
}
`