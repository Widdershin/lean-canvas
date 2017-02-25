import {makeDOMDriver, div, img, h2, textarea} from '@cycle/dom';
import {timeDriver} from '@cycle/time';
import {run} from '@cycle/run';
import xs from 'xstream';
import Collection from '@cycle/collection';

const drivers = {
  DOM: makeDOMDriver('body'),
  Time: timeDriver
}

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

function Note (sources) {
  function view ([position, text, editing]) {
    return (
      div('.note', {style: {left: `${position.x - 35}px`, top: `${position.y - 35}px`}}, [
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

  const position$ = xs.merge(
    sources.position$,
    mouseMove$
  );

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

  const text$ = sources.DOM
    .select('.input')
    .events('change')
    .map(ev => ev.target.value)
    .startWith('');


  return {
    DOM: xs.combine(position$, text$, editing$).map(view)
  }
}

function main (sources) {
  const documentSource = sources.DOM
    .select('document');

  const dblClick$ = documentSource
    .events('dblclick');

  const mousePosition$ = documentSource
    .events('mousemove')
    .compose(sources.Time.throttleAnimation)
    .map(ev => ({x: ev.clientX, y: ev.clientY}));

  const addNote$ = mousePosition$
    .map(mousePosition => dblClick$.mapTo({position$: xs.of(mousePosition)}))
    .flatten();

  const noteSources = {...sources, mousePosition$};

  const notes$ = Collection(Note, noteSources, addNote$);

  const notesDOM$ = Collection.pluck(notes$, note => note.DOM)

  return {
    DOM: notesDOM$.map(view).map(applyKeys)
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

run(main, drivers)
