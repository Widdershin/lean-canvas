import {makeDOMDriver, div, img, h2, textarea} from '@cycle/dom';
import {makeHTTPDriver} from '@cycle/http';
import {timeDriver} from '@cycle/time';
import {run} from '@cycle/run';
import xs from 'xstream';
import fromEvent from 'xstream/extra/fromEvent';
import {RestCollection} from 'cycle-rest-collection/dist/rest';

function view (noteVtrees) {
  return (
    div('.canvas', {key: 'canvas'}, [
      div('.row.top', [
        div('.column.leaf', [
          h2('Problem'),
          h2('Existing alternatives'),
          div('.number', '1'),
        ]),
        div('.column', [
          div('.row.leaf', [
            h2('Solution'),
            div('.number', '4')
          ]),
          div('.row.leaf', [
            h2('Key metrics'),
            div('.number', '8')
          ])
        ]),
        div('.column.leaf', [
          h2('Unique Value Proposition'),
          h2('High-Level Concept'),
          div('.number', '3'),
        ]),
        div('.column', [
          div('.row.leaf', [
            h2('Unfair Advantage'),
            div('.number', '9')
          ]),
          div('.row.leaf', [
            h2('Channels'),
            div('.number', '5')
          ])
        ]),
        div('.column.leaf', [
          h2('Customer Segments'),
          h2('Early Adopters'),
          div('.number', '2'),
        ])
      ]),
      div('.row.bottom', [
        div('.column.leaf', [
          h2('Cost Structure'),
          div('.number', '6'),
        ]),
        div('.column.leaf', [
          h2('Revenue Streams'),
          div('.number', '7'),
        ])
      ]),
      div('.notes', {key: 'notes'},  noteVtrees)
    ])
  );
}

function replace (newState) {
  return state => newState;
}

function merge (newState) {
  return state => ({...state, ...newState});
}

function Note (sources) {
  function view ([state, editing, canvasDimensions]) {
    const {x, y, text} = state;
    const saving = 'tempId' in state;

    return (
      div('.note', {class: {saving}, style: {left: `${canvasDimensions.width * x - 35}px`, top: `${canvasDimensions.height * y - 35}px`}}, [
        editing ? textarea('.input', {}, text) : text
      ])
    );
  }

  const mouseDown$ = sources.DOM
    .select('.note')
    .events('mousedown');

  const mouseUp$ = sources.DOM
    .select('document')
    .events('mouseup');

  const mouseMove$ = mouseDown$
    .map(() => sources.mousePosition$.endWhen(mouseUp$))
    .flatten();

  const startEditing$ = sources.DOM
    .select('.note')
    .events('dblclick')
    .debug(ev => ev.stopPropagation())
    .mapTo(true);

  const stopEditing$ = sources.DOM
    .select('.input')
    .events('change')
    .mapTo(false)

  const editing$ = xs.merge(
    startEditing$,
    stopEditing$
  ).startWith(false);

  const textChange$ = sources.DOM
    .select('.input')
    .events('change')
    .map(ev => ev.target.value)

  const reducer$ = xs.merge(
    sources.state$.map(replace),
    textChange$.map(text => ({text})).map(merge),
    mouseMove$.map(merge)
  );

  const state$ = reducer$.fold((state, reducer: Function) => reducer(state), {text: '', x: 0, y: 0});

  return {
    DOM: xs.combine(state$, editing$, sources.dimensions$).map(view),
    state$
  }
}

function main (sources) {
  const documentSource = sources.DOM
    .select('document');

  const dimensions$ = sources.Dimensions
    .compose(sources.Time.throttleAnimation)
    .remember()

  const dblClick$ = documentSource
    .events('dblclick');

  const mousePosition$ = documentSource
    .events('mousemove')
    .compose(sources.Time.throttleAnimation)
    .map(ev => ({x: ev.clientX / window.innerWidth, y: ev.clientY / window.innerHeight}))
    .remember();

  const add$ = mousePosition$
    .map(mousePosition => dblClick$.mapTo({state$: xs.of({...mousePosition, text: ''})}))
    .flatten()

  const noteSources = {...sources, mousePosition$, dimensions$, add$};

  const notes = RestCollection(
    Note,
    noteSources,
    [location.href, 'notes'].join('/')
  );

  const notesDOM$ = notes.pluck(note => note.DOM)
  const noteUpdateRequest$ = notes.HTTP

  return {
    DOM: notesDOM$.map(view).map(applyKeys),
    HTTP: noteUpdateRequest$
  }
}

function safeMap (arr, f) {
  if (arr && 'map' in arr) {
    return arr.map(f);
  }

  return arr;
}

function applyKeys (vtree, parentKey = '', index = 0) {
  if (vtree.key !== undefined) {
    return {
      ...vtree,

      children: safeMap(vtree.children, (child, index) => applyKeys(child, vtree.key, index))
    }
  }

  const key = parentKey + `-${index}`;

  return {
    ...vtree,

    key,

    children: safeMap(vtree.children, (child, index) => applyKeys(child, key, index))
  }
}

function railsify (httpDriver, token) {
  function applyToken (request) {
    const headers = request.headers || {};

    return {
      ...request,

      headers: {
        ...request.headers,

        'X-CSRF-Token': token
      }
    }
  }

  return function driver (sink$) {
    const sinkWithToken$ = sink$.map(applyToken)
    .debug('requrest')

    return httpDriver(sinkWithToken$);
  }
}

function resizeDriver () {
  const dimensions$ = fromEvent(window, 'resize')
    .map(ev => ({width: window.innerWidth, height: window.innerHeight}))
    .startWith({width: window.innerWidth, height: window.innerHeight})
    .remember();

  return dimensions$;
}

function start (token) {
  const drivers = {
    DOM: makeDOMDriver('.app'),
    HTTP: railsify(makeHTTPDriver(), token),
    Time: timeDriver,
    Dimensions: resizeDriver
  }

  run(main, drivers)
}

export {
  start
}

