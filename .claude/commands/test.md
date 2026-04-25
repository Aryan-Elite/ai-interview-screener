Write test cases for the file or feature I specify.

Follow these rules:
- Test the happy path first (normal expected input)
- Test edge cases (empty input, one-word answers, very long input, missing fields)
- Test error cases (invalid request body, API failure, network error)
- Each test must have a clear name describing exactly what it checks
- Keep tests simple and readable — no clever abstractions

For backend routes, use supertest + jest.
For frontend components, use React Testing Library + jest.

After writing tests, run them and report:
- How many passed
- How many failed
- What needs to be fixed if any fail

Also update context/decisions.md with a note about what was tested and any edge cases discovered.
