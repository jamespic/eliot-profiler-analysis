import humanizeDuration from 'humanize-duration'
import moment from 'moment'

export function humanizeSeconds (seconds) {
  return humanizeDuration(
    seconds * 1000,
    {
      largest: 2,
      round: true,
      units: ['y', 'mo', 'd', 'h', 'm', 's', 'ms'],
      language: (typeof window !== 'undefined') ? window.navigator.language.split('-')[0] : 'en'
    }
  )
}

export function humanizeMoment (m) {
  return moment(m).format('LTS l')
}
