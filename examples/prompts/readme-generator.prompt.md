---
name: readme-generator
description: Generate a polished README.md from project details
tags: [docs, generation]
variables:
  - projectName
  - description
  - techStack
  - features
---
Write a professional README.md for the project **{{projectName}}**.

## Project
{{description}}

## Tech Stack
{{techStack}}

## Features
{{features}}

The README should include:
- A catchy one-liner badge row
- Clear installation instructions
- Quick start section with a code example
- Feature overview with emoji indicators
- Contribution guidelines placeholder
- License badge (MIT)

Use this style: clear headings, fenced code blocks, and inline badges where appropriate. Keep it under 80 lines.