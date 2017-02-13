'use strict'
import {selfGraph, stripMessageBarriers, flattenByMethod, flattenByFile, summariseCallGraph} from '../src/js/views/callgraph-helpers'
import {expect} from 'chai'

describe('selfGraph', function () {
  it('should produce a self-time graph', function () {
    expect(selfGraph({
      self_time: 5.0,
      children: [
        {
          instruction: 'instruction-1',
          self_time: 2.0,
          children: [
            {
              instruction: 'subinstruction-1',
              self_time: 4.0
            }
          ]
        },
        {
          instruction: 'instruction-2',
          self_time: 8.0,
          children: [
            {
              instruction: 'subinstruction-1',
              self_time: 2.0
            }
          ]
        }
      ]
    })).to.deep.equal([
      {
        instruction: 'instruction-2',
        self_time: 8.0,
        callers: []
      },
      {
        instruction: 'subinstruction-1',
        self_time: 6.0,
        callers: [
          {
            instruction: 'instruction-1',
            self_time: 4.0,
            callers: []
          },
          {
            instruction: 'instruction-2',
            self_time: 2.0,
            callers: []
          }
        ]
      },
      {
        instruction: 'instruction-1',
        self_time: 2.0,
        callers: []
      }
    ])
  })
})

describe('stripMessageBarriers', function () {
  it('should strip messages, and coalesce newly adjacent nodes', function () {
    expect(stripMessageBarriers({
      task_uuid: '12345',
      start_time: '2016-01-01T09:00:00',
      end_time: '2016-01-01T09:00:06',
      time: 5,
      self_time: 1,
      children: [
        {
          instruction: 'hello',
          start_time: '2016-01-01T09:00:00',
          end_time: '2016-01-01T09:00:02',
          time: 2,
          self_time: 1,
          children: [
            {
              instruction: 'hello',
              start_time: '2016-01-01T09:00:01',
              end_time: '2016-01-01T09:00:02',
              time: 1,
              self_time: 1
            }
          ]
        },
        {
          message: 'Hello World',
          start_time: '2010-01-01T00:00:00', // Should be ignored
          end_time: '2020-01-01T00:00:00',
          time: 0,
          self_time: 0
        },
        {
          instruction: 'hello',
          start_time: '2016-01-01T09:00:03',
          end_time: '2016-01-01T09:00:06',
          time: 3,
          self_time: 2,
          children: [
            {
              instruction: 'hello',
              start_time: '2016-01-01T09:00:04',
              end_time: '2016-01-01T09:00:05',
              time: 1,
              self_time: 1
            }
          ]
        },
        {
          instruction: 'world',
          start_time: '2016-01-01T09:00:06',
          end_time: '2016-01-01T09:00:08',
          time: 2,
          self_time: 1,
          children: [
            {
              instruction: 'hello',
              start_time: '2016-01-01T09:00:07',
              end_time: '2016-01-01T09:00:08',
              time: 1,
              self_time: 1
            }
          ]
        }
      ]
    })).to.deep.equal({
      task_uuid: '12345',
      start_time: '2016-01-01T09:00:00',
      end_time: '2016-01-01T09:00:06',
      time: 5,
      self_time: 1,
      children: [
        {
          instruction: 'hello',
          start_time: '2016-01-01T09:00:00',
          end_time: '2016-01-01T09:00:06',
          time: 5,
          self_time: 3,
          children: [
            {
              instruction: 'hello',
              start_time: '2016-01-01T09:00:01',
              end_time: '2016-01-01T09:00:05',
              time: 2,
              self_time: 2,
              children: []
            }
          ]
        },
        {
          instruction: 'world',
          start_time: '2016-01-01T09:00:06',
          end_time: '2016-01-01T09:00:08',
          time: 2,
          self_time: 1,
          children: [
            {
              instruction: 'hello',
              start_time: '2016-01-01T09:00:07',
              end_time: '2016-01-01T09:00:08',
              time: 1,
              self_time: 1,
              children: []
            }
          ]
        }
      ]
    })
  })
  it('optionally flatten recursion', function () {
    expect(stripMessageBarriers({
      task_uuid: '12345',
      start_time: '2016-01-01T09:00:00',
      end_time: '2016-01-01T09:00:06',
      time: 5,
      self_time: 1,
      children: [
        {
          instruction: 'Hello',
          start_time: '2016-01-01T09:00:00',
          end_time: '2016-01-01T09:00:02',
          time: 2,
          self_time: 1,
          children: [
            {
              instruction: 'hello',
              start_time: '2016-01-01T09:00:01',
              end_time: '2016-01-01T09:00:02',
              time: 1,
              self_time: 1
            }
          ]
        },
        {
          message: 'Hello World',
          start_time: '2010-01-01T00:00:00', // Should be ignored
          end_time: '2020-01-01T00:00:00',
          time: 0,
          self_time: 0
        },
        {
          instruction: 'hello',
          start_time: '2016-01-01T09:00:03',
          end_time: '2016-01-01T09:00:06',
          time: 4,
          self_time: 2,
          children: [
            {
              instruction: 'Hello',
              start_time: '2016-01-01T09:00:04',
              end_time: '2016-01-01T09:00:05',
              time: 1,
              self_time: 1,
              children: [
                {
                  instruction: 'world',
                  start_time: '2016-01-01T09:00:04',
                  end_time: '2016-01-01T09:00:05',
                  time: 1,
                  self_time: 0,
                  children: [
                    {
                      instruction: 'Hello',
                      start_time: '2016-01-01T09:00:04',
                      end_Time: '2016-01-01T09:00:05',
                      time: 1,
                      self_time: 1
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          instruction: 'world',
          start_time: '2016-01-01T09:00:06',
          end_time: '2016-01-01T09:00:08',
          time: 2,
          self_time: 1,
          children: [
            {
              instruction: 'hello',
              start_time: '2016-01-01T09:00:07',
              end_time: '2016-01-01T09:00:08',
              time: 1,
              self_time: 1
            }
          ]
        }
      ]
    }, x => x.toUpperCase())).to.deep.equal({
      task_uuid: '12345',
      start_time: '2016-01-01T09:00:00',
      end_time: '2016-01-01T09:00:06',
      time: 5,
      self_time: 1,
      children: [
        {
          instruction: 'HELLO',
          start_time: '2016-01-01T09:00:00',
          end_time: '2016-01-01T09:00:06',
          time: 6,
          self_time: 5,
          children: [
            {
              instruction: 'WORLD',
              start_time: '2016-01-01T09:00:04',
              end_time: '2016-01-01T09:00:05',
              time: 1,
              self_time: 0,
              children: [
                {
                  instruction: 'HELLO',
                  start_time: '2016-01-01T09:00:04',
                  end_Time: '2016-01-01T09:00:05',
                  time: 1,
                  self_time: 1,
                  children: []
                }
              ]
            }
          ]
        },
        {
          instruction: 'WORLD',
          start_time: '2016-01-01T09:00:06',
          end_time: '2016-01-01T09:00:08',
          time: 2,
          self_time: 1,
          children: [
            {
              instruction: 'HELLO',
              start_time: '2016-01-01T09:00:07',
              end_time: '2016-01-01T09:00:08',
              time: 1,
              self_time: 1,
              children: []
            }
          ]
        }
      ]
    })
  })
})

describe('flattenByMethod', function () {
  it('should strip the line number', function () {
    expect(flattenByMethod('file.py:method:1')).to.equal('file.py:method')
  })
  it('should not strip line numbers if not present', function () {
    expect(flattenByMethod('file.py:method')).to.equal('file.py:method')
  })
  it('should not strip line numbers if only file present', function () {
    expect(flattenByMethod('file.py')).to.equal('file.py')
  })
})

describe('flattenByFile', function () {
  it('should strip the line number', function () {
    expect(flattenByFile('file.py:method:1')).to.equal('file.py')
  })
  it('should not strip line numbers if not present', function () {
    expect(flattenByMethod('file.py')).to.equal('file.py')
  })
})

describe('summariseCallGraph', function () {
  it('should extract actions if present', function () {
    expect(summariseCallGraph({
      task_uuid: '123',
      instruction: 'start',
      message: {action_type: 'anAction'},
      children: [
        {
          message: {action_type: 'anotherAction'},
          children: [{message: {action_type: 'aSubAction'}}]
        },
        {message: {action_type: 'anotherAction2'}},
        {message: {action_type: 'anotherAction3'}},
        {message: {action_type: 'aRedundantAction'}}
      ]
    })).to.equal('anAction, anotherAction, aSubAction, anotherAction2, anotherAction3')
  })
  it('should fall back on instructions otherwise', function () {
    expect(summariseCallGraph({
      task_uuid: '123',
      instruction: 'inst1',
      children: [
        {
          instruction: 'inst2',
          children: [{instruction: 'inst3'}]
        },
        {instruction: 'inst4'},
        {instruction: 'inst5'},
        {instruction: 'redundant'}
      ]
    })).to.equal('inst1, inst2, inst3, inst4, inst5')
  })
  it('should output the task_uuid if no other fields are available', function () {
    expect(summariseCallGraph({
      task_uuid: '123'
    })).to.equal('123')
  })
  it('should output the empty string if all else fails', function () {
    expect(summariseCallGraph({})).to.equal('')
  })
})
