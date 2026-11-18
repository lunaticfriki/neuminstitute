---
tags: [neuminstitute, content, structure]
---

# Page structure

The `neum` site is a single page per locale (`/[locale]`, one of `ca`/`es`/
`en`), composed of five sections in this order:

1. **Hero** — `hero.*` keys. Title "Neum", subtitle, two CTAs (primary:
   discover online courses; secondary: contact us).
2. **Methodology** — `methodology.*` keys. Intro paragraph plus four
   feature cards: Individual Classes, Master Classes, Flexible Format,
   Digital Campus.
3. **Courses** — `courses.*` keys. Intro paragraph plus three programs:
   Preparation for Bachelor entry (pregrado), ABRSM/Trinity College Degrees
   (bachelor), Master Classes/seminars. Each program has a tag, title,
   description, and four bullet points. A closing CTA links out to the
   Discord campus.
4. **Team** — `team.*` keys, see [[team]]. Four members, plus an alumni
   institutions list.
5. **Contact** — `contact.*` keys. A contact form (name, email, subject,
   message, submit) plus a secondary path: join the Discord campus.

Shared chrome around all five sections: a nav bar (`nav.*` keys: Neum,
Methodology, Courses, Team, Contact, language toggle) and a footer
(`footer.*` keys: description, navigation heading, ABRSM exams/
certifications links, locations heading with Spain/Austria, copyright). A
mobile menu has its own open/close labels (`menu.*`).

## External links

- Discord campus: `https://discord.gg/ndPf6ZQjaG` — referenced by
  `hero.ctaPrimary`, `courses.campus`, and `contact.discord`.
