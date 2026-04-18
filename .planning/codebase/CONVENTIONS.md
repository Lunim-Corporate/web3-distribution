# CONVENTIONS.md

## Coding Style
- **TypeScript Integration**: The project is in a transitional phase migrating from JavaScript/JSX to TypeScript/TSX. Active features are built using typed React components where available.
- **Styling**: `tailwindcss` utility classes handle all responsive styling inline; component-specific css isolation is avoided, favoring standard Tailwind standard utility composition.
- **Component Design**: 
  - Functions are generally exported as default (`export default function Navbar`).
  - Use of generic inline event handlers via React for dynamic custom events (`new CustomEvent`, e.g., in `open-demo` listener inside `page.tsx`).

## Error Handling
- React Hook error states largely try to use native standard React state abstractions over custom error boundaries globally.

## Tooling
- `eslint-config-next` is leveraged for Next.js explicit code-quality enforcement.
