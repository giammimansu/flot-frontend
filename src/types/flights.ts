export interface ResolvedFlight {
  flightNumber: string
  origin: string
  originName: string
  flightTime: string    // ISO8601 UTC
  displayTime: string   // "HH:MM" local at destination
  date: string          // "YYYY-MM-DD" local date
  status?: string
}

export interface FlightRow {
  number: string
  originIata: string
  originName: string
  destIata: string
  destName: string
  scheduledTimeLocal: string
  status: string
}
