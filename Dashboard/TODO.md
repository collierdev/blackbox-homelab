# Dashboard TODO & Bugs

## Critical Bugs
- [ ] BUG-001: Fix Tasks view rendering issue - TodoList component not mounting properly !high
- [ ] Investigate Socket.io event emissions for todos and projects !high
- [ ] Add debug logging to track component lifecycle !medium

## Test Selector Fixes
- [x] BUG-002: Fix calendar view options selector (Day/Today ambiguity)
- [x] BUG-003: Fix project filter dropdown test (hidden options)
- [x] Add data-testid attributes to TodoList component
- [x] Add data-testid attributes to CalendarTodoView component

## Services & Monitoring
- [x] Add Neo4j to services monitoring dashboard
- [ ] Test Neo4j service status display !medium
- [ ] Verify Neo4j connection on dashboard startup !low

## Testing & Validation
- [ ] Run Playwright E2E tests after bug fixes !high
- [ ] Document test results !medium
- [ ] Create manual testing checklist !low

## Documentation
- [ ] Update IMPLEMENTATION_COMPLETE.md with bug fixes !medium
- [ ] Update BUGS.md with fix status !medium
- [ ] Update CLAUDE.md with Neo4j service info !low

## Future Enhancements
- [ ] Add recurring events support !low
- [ ] Implement task dependencies !low
- [ ] Add notifications/reminders !low
- [ ] Mobile responsive improvements !low
