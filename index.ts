import {makeDOMDriver, div} from '@cycle/dom';
import {run} from '@cycle/run';
import xs from 'xstream';

const drivers = {
  DOM: makeDOMDriver('body')
}

function main (sources) {
  return {
    DOM: xs.of(div('hello world'))
  }
}

run(main, drivers)
