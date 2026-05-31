# Flot Mobile App — UI Kit

## Overview
Interactive click-through prototype of the Flot taxi-pooling mobile app. Covers the 3 core user moments:

1. **Home + Trip Creation** — create a new shared ride from the airport
2. **Matching** — search for a compatible co-rider
3. **Connection** — view match, unlock, and chat

## Screens
| Screen | Description |
|--------|-------------|
| Home | Active trips overview, quick-create CTA |
| New Trip | Trip creation form (terminal, destination, flight, luggage) |
| Matching | Search in progress + match found reveal |
| Match Detail | Co-rider profile, pricing, unlock CTA |
| Chat | In-app messaging with matched rider |

## Components
All JSX components are in modular files:
- `components.jsx` — Shared primitives (Avatar, Badge, Button, Input, Card, etc.)
- `screens.jsx` — Full screen compositions using the primitives
- `ios-frame.jsx` — Device bezel (starter component)

## Usage
Open `index.html` to interact with the prototype. Click through screens using the bottom nav and action buttons.

## Design Tokens
All styles reference CSS custom properties from `../../colors_and_type.css`.
