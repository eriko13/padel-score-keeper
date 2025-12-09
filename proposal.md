## Overview
Padel Score Keeper is a simple web app to set up padel doubles fast, auto-create teams, score live, and save results so players avoid manual tracking and disputes.

## Target Audience
- Casual padel groups that rotate partners.
- Club staff who need quick court assignments.
- Small leagues that want light tracking without heavy software.

## Major Functions
1) Roster: add, edit, remove players and mark who is available.  
2) Team pairing: send player list to an external API to create balanced pairs.  
3) Team naming: call a random-word API to assign quick team names.  
4) Match setup: pick players, format (best-of-3/no-ad), and court, then start.  
5) Live scoring: buttons to add/remove points, games, sets with padel flow; undo/redo.  
6) Scoreboard view: big, high-contrast display for courtside.  
7) History: save finished matches locally and show wins/losses and streaks.  
8) Schedule: generate a simple rotation so everyone plays different partners.  
9) Export/share: copy a match summary link or download CSV/PNG.  
10) Alerts: visual cue when a game or set is won; show who serves next.

## Wireframes (text)
- Mobile home: logo, “Create Match”, “Roster”, recent matches list.  
- Mobile match setup: player chips, “Generate Teams”, team cards with names/colors, scoring options.  
- Mobile live scoring: two stacked team panels, serve dot, +/− buttons, undo/redo, end match.  
- Desktop home: left nav, main cards for quick actions, recent matches grid.  
- Desktop live scoring: two columns for teams, center controls, right rail for event log.  
- Desktop schedule: table of upcoming rotations per court with print button.

## External Data
- Pairing API: Random.org-style combination endpoint to help build teams.  
- Team name API: Random Word API for quick team names.  
- Stored locally: roster, matches, settings, generated schedules, exports.

## Module List
- Storage helper (localStorage).  
- API clients: pairingClient, teamNameClient.  
- Roster UI.  
- Team generator.  
- Match setup form.  
- Scoring engine with undo/redo.  
- Scoreboard display.  
- History & stats list.  
- Schedule/rotation builder.  
- Export/share helper.

## Graphic Identity
- Colors: Navy #0B172A, Blue #2D7FF9, Lime #A4FF4F, Light Gray #F3F4F6, Dark Text #1F2933.  
- Typography: Inter for headings and body.  
- Icon: Simple padel racket with ball in a circle, lime on navy.

## Timeline (Weeks 5–7)
- Week 5: Roster CRUD, API clients, team generator, basic styles.  
- Week 6: Scoring engine, live scoreboard, history save/view, animations for score changes.  
- Week 7: Schedule builder, export/share, accessibility pass, responsive polish, testing, handoff.

## Project Planning
Trello board: https://trello.com/b/padel-score-keeper

## Challenges
- Keeping team generation balanced and fast.  
- Making the scoring engine reliable with undo/redo.  
- Ensuring offline-friendly saves without data loss.  
- Designing controls that are easy to tap during live play.  
- Handling API limits and offline fallbacks.

