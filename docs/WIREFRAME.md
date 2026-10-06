# AZ Garage Door: conversion wireframe

The structure the layout was built from, and why each section is there.

## Business context

AZ Garage Door is an owner-operated repair company working the Phoenix valley
since 2011. The work is almost entirely reactive: a spring snaps, an opener
dies, a door comes off its track, and someone needs it fixed today. Often with a
car trapped inside.

That shapes everything. The visitor is not browsing, they are in a small
emergency, frequently on a phone, sometimes standing in the garage. The
conversion is a phone call, not a form submission and not a purchase. The form
exists for people who would rather type at 11pm than talk.

The competitive problem is trust, not awareness. Garage door repair has a
reputation for quoting low on the phone and inflating at the door, so the entire
page is organised around one promise: the number we say is the number you pay.

## Why this is not a copy of the sample layout

The Topfloor sample is a roofing template. Roofing sells craftsmanship on a
planned, high-consideration job, so it leads with portfolio galleries, a team
roster and a blog. Garage door repair sells price certainty on an unplanned one.

The section shells are kept where they earn their place and repointed:

| Sample section | What it became | Why |
|---|---|---|
| Team slider | Pricing selector | Nobody picks a repair company by technician headshot. They pick on price. |
| Blog row | FAQ accordion | There is no blog. The FAQ absorbs the last objections instead. |
| Portfolio gallery | Work grid with before/after | Kept, but one tile drags to compare, which proves the work better than a static photo. |
| (nothing) | Symptom checker | The sample has no diagnostic step. This is the first question we ask on the phone. |
| (nothing) | Door anatomy explorer | Callers rarely know the name of the part. Teaching it shortens the call. |
| (nothing) | Quote form | The sample has no on-page conversion point at all. |

## Section order

1. **Hero** with video background, three-line headline, two CTAs, and a
   quick-price widget. The widget is the page's thesis: pick your problem, see
   the price, call. It is preselected on "Broken spring" so it is never empty.
2. **Stats band.** 2,400+ doors leads at double the type size. Since 2011,
   5-year warranty, 24/7 same rate, $0 trip fee support it. Counts up on scroll.
3. **Door anatomy.** Clickable hotspots on a cutaway door, synced to a part list
   and a detail panel: what it does, how it fails, whether the door is safe to
   use, and the price. Answers "what broke?" before the call.
4. **About** with a horizontal timeline from 2011 to now, and four promises as
   cards that expand.
5. **Symptom checker.** Five symptoms, each returning the usual cause, a
   colour-coded safety verdict, and a CTA. Safety first, price second.
6. **Services.** Six failures in an offset grid, ordered by how often the phone
   rings for each.
7. **How it works.** Four steps with a line that draws in on scroll. The price
   lands at step two, which is the whole point.
8. **Pricing.** A selector rather than four identical cards, plus a spring
   estimator that does the $175 x N + $99 arithmetic.
9. **Urgent band.** Full-bleed red, for the car-trapped-right-now visitor who
   skipped everything above.
10. **Recent work.** Masonry grid, one tile a before/after slider, filterable by
    job type.
11. **Service areas.** Interactive list and map diagram, so people can check
    coverage without calling.
12. **Testimonials.** Draggable carousel with a featured quote and initials
    avatars. Only real reviews.
13. **FAQ.** Seven questions, all objection handling: same day, trip fee, why
    both springs, warranty, coverage, safety.
14. **Quote form and footer.** Form for the after-hours typist, footer CTA band
    for everyone else.

## Rhythm

No two adjacent sections share a structure. Full-bleed video, then a solid band
of tiles, then a three-column explorer, then a horizontal timeline, then a split
control panel, then an offset grid, and so on. The page should never feel like
one template applied fourteen times.

## Mobile

The order holds, but the emphasis shifts. A sticky call bar sits at the bottom
of every screen, the header collapses to a short "Call" button plus a burger,
the anatomy hotspots become a horizontal scroll of part tabs, and the stats
band becomes a stacked list. Every touch target clears 44px.

## What is deliberately absent

No certifications, licence numbers, awards, brand partnerships, response-time
promises or percentage claims appear anywhere. The business is not a licensed
contractor and the footer says so. Everything on the page is a fact the owner
can stand behind.
