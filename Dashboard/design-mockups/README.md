# Pi Dashboard Design Mockups

This directory contains visual mockups and design specifications for potential UI improvements to the Pi Dashboard.

## Files

### Design Specifications
- **FIGMA_DESIGN_SPEC.md** - Comprehensive design specification document with detailed tokens, components, and layout guidelines for Figma implementation

### HTML Mockups
These are interactive HTML mockups that can be opened in a browser to visualize design concepts:

1. **mockup-modern.html** - Modern gradient design with enhanced visual hierarchy
   - Features: Gradient header, elevated cards, smooth transitions
   - Best for: Professional, vibrant aesthetic

2. **mockup-glassmorphism.html** - Glassmorphism design with frosted glass effects
   - Features: Backdrop blur, translucent cards, animated effects
   - Best for: Modern, trendy aesthetic

3. **mockup-dark-mode.html** - Enhanced dark mode design
   - Features: True dark colors, better contrast, glow effects
   - Best for: Night-time use, reduced eye strain

4. **mockup-neumorphism.html** - Neumorphism/soft UI design
   - Features: Soft shadows, inset/outset effects, tactile feel
   - Best for: Unique, modern aesthetic with depth

5. **mockup-minimal.html** - Minimalist clean design
   - Features: Clean lines, subtle borders, plenty of white space
   - Best for: Professional, uncluttered aesthetic

6. **mockup-analytics.html** - Data-dense analytics dashboard style
   - Features: Dark theme, compact layout, change indicators, metrics
   - Best for: Power users, data-focused interface

7. **mockup-colored-cards.html** - Vibrant colored gradient cards
   - Features: Gradient stat cards, colorful header, visual distinction
   - Best for: Eye-catching, modern design with color coding

8. **mockup-sidebar.html** - Sidebar navigation layout
   - Features: Fixed sidebar navigation, main content area, clean separation
   - Best for: Traditional dashboard layout with persistent navigation

9. **mockup-dashboard-grid.html** - CSS Grid-based layout
   - Features: 12-column grid system, flexible card sizing, dark theme
   - Best for: Professional dashboard with structured layout

10. **mockup-tabs-top.html** - Top tab navigation
    - Features: Horizontal tabs in header, clean separation, sticky header
    - Best for: Multi-section interface with clear navigation

11. **mockup-card-masonry.html** - Masonry/pinterest-style layout
    - Features: Column-based layout, variable card heights, responsive
    - Best for: Visual content with varying sizes

12. **mockup-brutalist.html** - Brutalist design aesthetic
    - Features: Bold borders, bright colors, rotated cards, strong typography
    - Best for: Bold, attention-grabbing design

13. **mockup-terminal.html** - Terminal/CLI style interface
    - Features: Terminal window UI, monospace font, command prompt aesthetic
    - Best for: Developer-focused, nostalgic design

14. **mockup-compact-list.html** - Compact list-based layout
    - Features: List items with inline metrics, minimal spacing, efficient use of space
    - Best for: Dense information display

15. **mockup-split-panel.html** - Split panel layout
    - Features: Left sidebar with stats, right panel with content, dual-pane design
    - Best for: Monitoring dashboard with persistent metrics

16. **mockup-ios-style.html** - iOS/macOS design language
    - Features: Glassmorphism, rounded corners, SF Pro typography, iOS colors
    - Best for: Apple ecosystem aesthetic

17. **mockup-cyberpunk.html** - Cyberpunk/futuristic style
    - Features: Neon green on black, glowing effects, matrix aesthetic
    - Best for: Sci-fi, gaming, futuristic theme

18. **mockup-material.html** - Material Design 3
    - Features: Elevation, shadows, Material color palette, MD guidelines
    - Best for: Google ecosystem, Material Design compliance

19. **mockup-mobile-first.html** - Mobile-first responsive design
    - Features: Bottom navigation, touch-optimized, responsive grid, mobile-first approach
    - Best for: Mobile users, touch interfaces

20. **mockup-windows95.html** - Windows 95 retro style
    - Features: Classic Windows UI, beveled borders, retro aesthetic, nostalgic
    - Best for: Retro gaming, nostalgic appeal

21. **mockup-floating-cards.html** - Floating card animations
    - Features: Animated floating cards, gradient background, hover elevations
    - Best for: Dynamic, engaging interface

22. **mockup-vertical-tabs.html** - Vertical tab navigation
    - Features: Left sidebar tabs, icon-based navigation, persistent sidebar
    - Best for: Traditional desktop application layout

23. **mockup-newspaper.html** - Newspaper/print layout
    - Features: Column-based layout, serif typography, print-style design
    - Best for: Editorial, news-style presentation

24. **mockup-circular-gauges.html** - Circular gauge visualization
    - Features: SVG circular gauges, gradient fills, centered metrics
    - Best for: Visual data representation, modern dashboard feel

25. **mockup-fullscreen-hero.html** - Fullscreen hero section
    - Features: Full viewport hero, large typography, minimal UI, scroll indicator
    - Best for: Landing page style, first impression focus

26. **mockup-widget-grid.html** - Widget-based grid
    - Features: Uniform widget cards, grid layout, consistent sizing
    - Best for: Dashboard with multiple widgets, customizable layouts

27. **mockup-matrix-style.html** - Matrix/terminal aesthetic
    - Features: Green terminal text, black background, command-line UI
    - Best for: Hacker aesthetic, terminal enthusiasts

## How to Use

### Viewing Mockups
1. Open any HTML file in a web browser
2. The mockups are static but demonstrate visual styling concepts
3. Use browser dev tools to inspect CSS and understand styling approaches

### Using for Figma
1. Open the HTML mockups as reference
2. Read `FIGMA_DESIGN_SPEC.md` for detailed specifications
3. Use the design tokens and component specs in Figma
4. Create components with auto-layout for responsive design
5. Set up design system with colors, text styles, and effects

## Design Concepts Overview

### Key Improvements Proposed

1. **Enhanced Visual Hierarchy**
   - Larger, bolder typography
   - Better spacing and grouping
   - Clear status indicators

2. **Better Cards**
   - Hover effects and elevation
   - Status-based styling (running/stopped/error)
   - Improved iconography

3. **Progress Indicators**
   - Gradient fills
   - Color-coded by thresholds
   - Smooth animations

4. **Service Cards**
   - Visual status indicators
   - Resource usage previews
   - Better action button placement

5. **Dark Mode**
   - True dark backgrounds
   - Better contrast ratios
   - Glow effects for important elements

## Implementation Priority

See `FIGMA_DESIGN_SPEC.md` for phased implementation recommendations:
- **Phase 1**: High impact improvements (stats cards, service cards, dark mode)
- **Phase 2**: Medium impact (tables, navigation, animations)
- **Phase 3**: Polish (sparklines, advanced features, search)

## Notes

- All mockups use CSS only (no JavaScript) for simplicity
- Colors and spacing align with current Tailwind CSS tokens where possible
- Responsive breakpoints: Mobile (320px), Tablet (768px), Desktop (1024px+)
- All designs maintain accessibility (WCAG AA contrast ratios)

## Feedback

These mockups serve as starting points for discussion. Feel free to:
- Mix and match elements from different mockups
- Adjust colors, spacing, or typography
- Suggest additional improvements
- Prioritize features based on user needs
