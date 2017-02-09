'use strict'
import {element} from 'deku'

export function ViewProfile ({props: {profileId}}) {
  return <h1>Viewing {profileId}</h1>
}

export function ViewSearch ({props: {params}}) {
  return <h1>Searching for {JSON.stringify(params)}</h1>
}
