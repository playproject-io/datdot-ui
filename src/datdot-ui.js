const debug = require('debug')
const bel = require('bel')
const csjs = require('csjs-inject')
const { lightFormat, getYear, getMonth, getDaysInMonth } = require('date-fns')
// widgets
const tab = require('datdot-ui-tab')
const calendarMonth = require('datdot-ui-calendar-month')
const timelineDays = require('datdot-ui-timeline-days')
const calendarDays = require('datdot-ui-calendar-days')
const datepicker = require('datdot-ui-datepicker')

module.exports = datdotui

function datdotui (opts) {
  const log = debug('datdot-ui')
  const { jobs, plans } = opts
  // set init date
  const date = new Date()
  let year = getYear(date)
  // get current month
  let currentMonth = getMonth(date)
  let currentDays = getDaysInMonth(date)
  // get next month
  let nextMonth = currentMonth+1
  let nextDays = getDaysInMonth(new Date(year, nextMonth))
  // store data
  let state = {}
  
  // SUB COMPONENTS
  const timelinedays = timelineDays( {data: null, style: `${css['timeline-days']}` }, timelineDaysProtocol )
  const tab1 = tab({from: jobs.title, arr: jobs.tab}, tabProtocol)
  const tab2 = tab({from: plans.title, arr: plans.tab}, tabProtocol)
  const calendarmonth1 = calendarMonth({from: jobs.title}, calendarMonthProtocol)
  const calendarmonth2 = calendarMonth({from: plans.title}, calendarMonthProtocol)
  const datepicker1 = datepicker({month1: [currentMonth, currentDays, year], month2: [nextMonth, nextDays, year] }, datepickerProtocol)

  const weekday = bel`<section class=${css['calendar-weekday']} role="weekday"></section>`
  const weekList= ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  weekList.map( w => weekday.append( bel`<div class=${css['calendar-week']} role="week">${w.slice(0 ,1)}</div>`))


  const element = bel`
  <div class=${css.wrap}>
    <section class=${css["ui-widgets"]}>

      <!--- tab start -->
      <div class=${css['ui-tab']}>
        <h2 class=${css.title}>Tab</h2>
        ${tab1}
        ${tab2}
      </div>
      <!--- // tab end -->

      <!--- ui-calendar-month start -->
      <div class=${css['ui-calendar-header']}>
        <h2 class=${css.title}>Calendar Header</h2>
        <div class=${css["custom-header"]}>${calendarmonth1}</div>
        <div class=${css["calendar-header-fullsize"]}>${calendarmonth2}</div>
      </div>
      <!--- // ui-calendar-month end -->

      <!--- ui-calendar-timeline-days start -->
      <div class=${css.days}>
        <h2 class=${css.title}>Timline days</h2>
        <div class=${css['calendar-timeline-days']}>${timelinedays}</div>
      </div>
      <!--- // ui-calendar-timeline-days end -->

      <!--- ui-datepicker start -->
      <div class=${css['ui-datepicker']}>
        <h2 class=${css.title}>Date Picker</h2>
        ${datepicker1}
      </div>
      <!--- // ui-datepicker end -->

    </section>
    <div class=${css.terminal}> </div>
  </div>`

  const [, terminal] = element.children
 
  return element
  /*********************************************
    PROTOCOLS
  *********************************************/
  function datepickerProtocol (send) {
    return function receiveFromDatepicker (message) {
      const { type } = message
      if (type === 'value') return log(message)
      log('<= received', message)
    }
  } 

  function tabProtocol (send) {
    return function receiveFromTab (message) {
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
    }
  }

  function calendarMonthProtocol (send) {
    return function receiveFromCalendarMonth (message) {
      const { from, flow, type, body, count, month, year, days } = message
      const log = debug(from)
      const logger = log.extend('datdot-ui')
      const calenderTitleChanges = log.extend(`${flow} changes >`)
      logger.log = domlog
      logger(message)

      // check calendar
      state.calendar = Object.assign({}, message)
      calenderTitleChanges('state', `${month} ${year}`, state.calendar)
      
      const typeTimeline = timelineDays( {from, data: state.calendar, style: `${css['timeline-days']}`}, timelineDaysProtocol )
      // type: 'multiple picker', '
      const timeline = document.querySelector(`.${css['calendar-timeline-days']}`)
      timeline.innerHTML = ''
      timeline.append(typeTimeline)
    }
  }

  // function calendarDaysProtocol (send) {
  //   return function receiveFromCalendarDays (message) {
  //     const { from, flow, type, body, count, month, year, days} = message
  //     const log = debug(from)
  //     const logger = log.extend('calendar-days')
  //     logger.log = domlog
  //     logger(`${type} day ${body}`, message) 
  //   }
  // }

  function timelineDaysProtocol (send) {
    return function receiveFromTimlineDays (message) {
      const { from, flow, type, body, count, month, year, days} = message
      const log = debug(from)
      const logger = log.extend('timeline-days')
      logger.log = domlog
      logger(`${type} day ${body}`, message) 
    }
  }

  function domlog(...args) {
    for (let obj of args) {
      if (typeof obj === 'object' && obj.hasOwnProperty('month')) var {from, flow, type, body, month, year, days} = obj
      if (typeof obj === 'object' && obj.hasOwnProperty('calendar-days')) var {from, flow, type, body, month, year, days} = obj
      if (typeof obj === 'object' && obj.flow === 'ui-tab') var {from, flow, type, body} = obj
    }
    const el = bel`<div>${from + " > "}  ${flow}: ${body} ${type} ${month && month} ${year && year}${days ? `, ${days} days` : null }</div>`
    // terminal.insertBefore(el, terminal.firstChild)
    terminal.append(el)
    terminal.scrollTop = terminal.scrollHeight
  }

}
const css = csjs`
body {
  margin: 0;
  padding: 0;
  font-family: Arial, Helvetica, sans-serif;
  background-color: #F2F2F2;
  height: 100%;
}
button:active, button:focus {
  outline: dotted 1px #c9c9c9;
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
.terminal div:last-child {
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
.ui-tab {

}
.ui-tab > nav {
  margin-bottom: 20px;
}
.title {
  color: #008dff;
}
.ui-calendar-header {
}
.custom-header {
  background-color: #f2f2f2;
  max-width: 25%;
  min-width: 225px;
  border-radius: 50px;
}
.custom-header > [class^="calendar-header"] {
  grid-template-rows: 30px;
}
.custom-header > [class^="calendar-header"] h3 {
  font-size: 16px;
}
.calendar-header-fullsize {
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
.calendar-section {
  margin-top: 30px;
  font-size: 12px;
}
.calendar-table-days {
  max-width: 210px;
}
.calendar-days {
  display: grid;
  grid-template-rows: auto;
  grid-template-columns: repeat(7, minmax(30px, auto));
  justify-items: center;
}
.calendar-weekday {
  display: grid;
  grid-template-rows: auto;
  grid-template-columns: repeat(7, 30px);
  justify-items: center;
}
.calendar-week {
}
.ui-datepicker {

}
`