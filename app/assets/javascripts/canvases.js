// Place all the behaviors and hooks related to the matching controller here.
// All this logic will automatically be available in application.js.

const start = require('./index.ts').start;

$(function () {
  const token = $('meta[name="csrf-token"]')[0].content;

  start(token);
});
