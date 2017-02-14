'use strict'
import css from './deku-css'
import CallGraph from '../src/js/views/callgraph'
import {expect} from 'chai'

const testGraph1 = {
  instruction: 'myfile.py:123',
  start_time: '2016-01-01T09:00:00',  // Cheat and put it in local time, to work around timezone unmockability
  end_time: '2016-01-01T09:01:00',
  time: 20.0,
  self_time: 10.0,
  message: 'Hello World',
  children: [{test: 'test'}]
}

const testGraph2 = {
  start_time: '2016-01-01T09:00:00',
  end_time: '2016-01-01T09:01:00',
  time: 20.0,
  self_time: 10.0,
  message: {action_type: 'event'},
  children: []
}

const testGraph3 = {
  source: 'localhost',
  thread: 123,
  task_uuid: '54321',
  start_time: '2016-01-01T09:00:00',
  end_time: '2016-01-01T09:01:00',
  time: 20.0,
  self_time: 10.0,
  children: []
}

describe('CallGraph', function () {
  it('should render a callgraph, formatting key data items', function () {
    let result = CallGraph({props: {callGraph: testGraph1, totalTime: 100.0}})
    expect(css(result, 'small #text')[0]).to.equal(
      '20 seconds (10 seconds self time) — 9:00:00 AM 1/1/2016 - 9:01:00 AM 1/1/2016'
    )
    expect(css(result, 'dl dt #text')[0]).to.equal('message')
    expect(css(result, 'dl dd #text')[0]).to.equal('Hello World')
    expect(css(result, 'dl dd')).to.have.length(1)
    let header = css(result, 'Expandable')[0].props.header
    expect(css(header, '.instruction #text')[0]).to.equal('myfile.py:123')
    let subgraphs = css(result, 'Expandable CallGraph')
    expect(subgraphs).to.have.length(1)
    expect(subgraphs[0].props.callGraph).to.deep.equal({test: 'test'})
  })
  it('should handle action_types, when present', function () {
    let result = CallGraph({props: {callGraph: testGraph2, totalTime: 100.0}})
    let header = css(result, 'Expandable')[0].props.header
    expect(css(header, '.instruction #text')[0]).to.equal('event')
  })
  it('should show source, thread and task_uuid for roots', function () {
    let result = CallGraph({props: {callGraph: testGraph3, totalTime: 100.0}})
    let header = css(result, 'Expandable')[0].props.header
    expect(css(header, '.instruction #text')[0]).to.equal(
      'localhost (Thread 123, Task 54321)'
    )
  })
})
