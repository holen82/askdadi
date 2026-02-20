# Copilot Instructions for Dadi

## Project Overview

This repository contains persona definitions for AI assistants - structured prompts that define specific roles and behaviors for different use cases.

## Repository Structure

- `persona/` - Individual persona definition files in Markdown format
- `.github/` - GitHub configuration and Copilot instructions

## Key Conventions

### Persona File Format

Each persona file follows a structured format:

1. **Title Line** - Role name (e.g., "Software App Requirements Analyst")
2. **Core Identity Statement** - Defines the expert role and primary purpose
3. **Core Responsibilities** - Key duties organized as bullet points under headers
4. **Framework/Process** - Structured approach the persona should follow
5. **Final Deliverable** - What output the persona should produce and its format
6. **Operating Rules** - Behavioral guidelines and constraints

### Writing Style

- **Professional and Clear** - Technical but accessible language
- **Structured Thinking** - Break down complex processes into logical steps
- **Explicit over Implicit** - State assumptions, constraints, and expectations clearly
- **User-Centric** - Focus on how the persona serves the user's needs

### Content Organization

- Use numbered or bulleted lists for scanability
- Group related concepts under descriptive headers
- Include "do not" statements to prevent unwanted behaviors
- Specify when outputs should be generated (e.g., "Do not generate X until Y")

## Working with Personas

When creating or modifying persona files:

1. **Define the Role Clearly** - Start with the specific expertise and domain
2. **Establish Boundaries** - What is in scope vs. out of scope
3. **Provide Process Structure** - How should the persona approach tasks sequentially
4. **Specify Deliverables** - What final outputs are expected and in what format
5. **Include Operating Rules** - Behavioral constraints and interaction patterns

## Adding New Personas

New persona files should:
- Be placed in the `persona/` directory
- Use descriptive kebab-case or simple lowercase names (e.g., `analyst.md`, `code-reviewer.md`)
- Follow the established format and structure
- Be self-contained and usable independently
