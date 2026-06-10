export interface ResolvedFlight {
  flightNumber: string
  origin: string
  originName: string
  destination: string
  flightTime: string         // ISO8601 UTC — arrival at destination
  displayTime: string        // "HH:MM" arrival local
  departureTime?: string     // ISO8601 UTC — departure from hub airport
  departureDisplayTime?: string // "HH:MM" departure local
  date: string               // "YYYY-MM-DD" local date
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
