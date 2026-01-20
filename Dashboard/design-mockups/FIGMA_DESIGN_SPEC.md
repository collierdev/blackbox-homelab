# Pi Dashboard UI Design Specification

This document provides detailed specifications for UI improvements to the Pi Dashboard, designed for implementation in Figma.

## Design Principles

### 1. Visual Hierarchy
- **Clear Information Architecture**: System stats → Services → Smart Home → Cameras
- **Progressive Disclosure**: Collapsible panels for detailed data (network services, processes)
- **Visual Grouping**: Related information grouped with consistent spacing

### 2. Color & Contrast
- **Semantic Colors**: Success (green), Warning (yellow), Destructive (red), Primary (blue)
- **Accessibility**: WCAG AA contrast ratios for all text
- **Status Indicators**: Color-coded badges for service status, system health

### 3. Spacing & Layout
- **Grid System**: 8px base unit for consistent spacing
- **Card Padding**: 16px (mobile) to 24px (desktop)
- **Section Gaps**: 24px between major sections
- **Responsive Breakpoints**: Mobile (320px), Tablet (768px), Desktop (1024px+)

### 4. Typography
- **Headings**: Bold, clear hierarchy (H1: 24px, H2: 20px, H3: 16px)
- **Body**: 14px default, 12px for secondary text
- **Monospace**: For IP addresses, ports, technical data
- **Font Family**: System font stack (system-ui, -apple-system, sans-serif)

## Proposed UI Improvements

### 1. Enhanced Header
**Current**: Basic header with hostname, connection status, theme toggle

**Proposed Improvements**:
- Add subtle gradient background (light: `hsl(220, 60%, 98%)` to `hsl(220, 60%, 95%)`)
- Larger logo/icon with hover animation
- Connection status with animated pulse when connected
- Quick stats preview: CPU temp, uptime in header
- Search bar for quick service/device lookup

**Design Tokens**:
- Header height: 72px (desktop), 64px (mobile)
- Padding: 24px horizontal
- Logo size: 40px × 40px

### 2. Stats Cards Redesign
**Current**: Simple cards with icon, title, and progress bars

**Proposed Improvements**:

**Option A - Glassmorphism**:
- Frosted glass effect with backdrop blur
- Subtle border glow on hover
- Animated progress bars with gradient fills
- Sparkline charts for historical data (CPU, Memory trends)
- Micro-interactions: cards lift on hover (elevation increase)

**Option B - Data-Dense Cards**:
- Larger typography for key metrics (48px for temperature)
- Mini sparkline charts in card corners
- Color-coded backgrounds based on thresholds:
  - CPU: Green (<50%), Yellow (50-80%), Red (>80%)
  - Memory: Similar threshold colors
  - Temperature: Blue (<50°C), Yellow (50-70°C), Red (>70°C)

**Design Tokens**:
- Card border-radius: 16px
- Card shadow: `0 4px 6px rgba(0, 0, 0, 0.05)`
- Hover shadow: `0 8px 16px rgba(0, 0, 0, 0.1)`
- Progress bar height: 8px
- Sparkline dimensions: 120px × 40px

### 3. Service Cards Enhancement
**Current**: Icon, name, status badge, action buttons

**Proposed Improvements**:
- **Grid Layout**: Responsive grid (1 col mobile, 2 cols tablet, 3 cols desktop)
- **Card States**:
  - Running: Green accent border (2px)
  - Stopped: Gray border, reduced opacity
  - Error: Red accent border, warning icon
- **Visual Hierarchy**:
  - Service icon: 48px × 48px with rounded background
  - Status badge: Pill-shaped, positioned top-right
  - Metrics preview: CPU/RAM shown as mini progress bars
- **Hover Effects**:
  - Card elevation increases
  - Action buttons become more prominent
  - Service URL preview tooltip

**Design Tokens**:
- Card padding: 20px
- Icon size: 48px × 48px
- Badge: 8px border-radius, 6px padding
- Button height: 36px

### 4. System Stats Tables
**Current**: Basic collapsible tables for network services and processes

**Proposed Improvements**:
- **Table Header**: Sticky header on scroll
- **Row States**: 
  - Hover: Subtle background highlight
  - Selected: Primary color accent
- **Sortable Columns**: Visual indicators (up/down arrows)
- **Row Actions**: Quick actions (copy IP, open URL) on hover
- **Empty States**: Friendly message when no data
- **Pagination**: For large process lists (show top 50 by default)

**Design Tokens**:
- Table row height: 48px
- Header row height: 40px
- Column padding: 16px
- Sort indicator size: 16px

### 5. Smart Home Controls
**Current**: Basic cards for lights, switches, climate, media players

**Proposed Improvements**:
- **Device Grid**: Responsive grid similar to services
- **Device Icons**: Larger, more expressive icons (48px)
- **Control Hierarchy**:
  - Primary action (toggle) prominent
  - Secondary controls (brightness, temp) below
  - Visual feedback on state changes (smooth transitions)
- **Grouping**: Room/area grouping with collapsible sections
- **Scene Presets**: Quick action buttons for common scenes

**Design Tokens**:
- Device card: 280px × 180px (min)
- Toggle switch: 44px × 24px
- Slider track: 4px height
- Slider thumb: 20px × 20px

### 6. Camera Section
**Current**: Grid of camera cards with streaming controls

**Proposed Improvements**:
- **Grid Layout**: Responsive (1 col mobile, 2 cols tablet, 3+ cols desktop)
- **Camera Card**:
  - Video preview thumbnail (static or animated)
  - Camera name with rename indicator
  - Status indicator (online/offline) with pulse animation
  - Controls overlay on hover
- **Fullscreen Mode**: Full-width modal with camera controls
- **Multi-view**: Option to show 4/9 cameras in grid simultaneously

**Design Tokens**:
- Camera card aspect ratio: 16:9
- Preview thumbnail: 320px × 180px
- Control overlay opacity: 0.9 on hover

### 7. Tab Navigation
**Current**: Simple tab buttons

**Proposed Improvements**:
- **Active Indicator**: Animated underline (slide transition)
- **Badge Counts**: Show number of items in each tab (e.g., "Services (8)")
- **Tab Icons**: Larger icons (20px) with better spacing
- **Mobile**: Horizontal scrollable tabs on mobile

**Design Tokens**:
- Tab height: 48px
- Underline height: 3px
- Icon size: 20px × 20px
- Padding: 16px horizontal

### 8. Dark Mode Enhancements
**Current**: Basic dark mode with inverted colors

**Proposed Improvements**:
- **True Dark**: Deep background (`hsl(222, 47%, 11%)`)
- **Card Elevation**: Subtle shadows for depth perception
- **Accent Colors**: More vibrant in dark mode
- **Reduced Glare**: Lower contrast borders
- **Status Colors**: Adjusted for better visibility in dark

**Color Palette (Dark Mode)**:
- Background: `hsl(222, 47%, 11%)`
- Card: `hsl(222, 47%, 15%)`
- Border: `hsl(217, 32%, 18%)`
- Primary: `hsl(217, 91%, 60%)`
- Text: `hsl(210, 40%, 98%)`

### 9. Animation & Micro-interactions
**Proposed Additions**:
- **Loading States**: Skeleton screens instead of spinner
- **Transition Timing**: 200ms for interactive elements
- **Hover States**: All interactive elements have hover feedback
- **State Changes**: Smooth transitions for metric updates
- **Drag & Drop**: Visual feedback during section reordering

**Timing Functions**:
- Ease-out: `cubic-bezier(0.4, 0, 0.2, 1)`
- Ease-in-out: `cubic-bezier(0.4, 0, 0.2, 1)`
- Bounce: `cubic-bezier(0.68, -0.55, 0.265, 1.55)` (for error states)

### 10. Mobile Responsiveness
**Proposed Improvements**:
- **Navigation**: Hamburger menu for mobile (if needed)
- **Card Stacking**: Single column layout on mobile
- **Touch Targets**: Minimum 44px × 44px for all buttons
- **Swipe Gestures**: Swipe to navigate tabs on mobile
- **Optimized Tables**: Horizontal scroll or card view for tables on mobile

## Component Library

### Buttons
- **Primary**: Blue background, white text, 36px height
- **Secondary**: Gray background, dark text, outlined
- **Destructive**: Red background, white text
- **Success**: Green background, white text
- **Ghost**: Transparent, text color

### Inputs
- **Text Input**: 40px height, 12px padding, rounded-lg
- **Select**: Same as text input with dropdown arrow
- **Checkbox**: 20px × 20px, rounded-sm
- **Slider**: Track height 4px, thumb 20px × 20px

### Badges
- **Status**: Pill-shaped, 8px border-radius
- **Count**: Small circle with number
- **Tag**: Rounded rectangle, subtle background

## Layout Specifications

### Container Widths
- Mobile: Full width with 16px padding
- Tablet: Max-width 768px, centered
- Desktop: Max-width 1280px, centered

### Grid System
- Columns: 12-column grid (desktop)
- Gutter: 24px between columns
- Margins: 24px vertical between sections

## Accessibility Considerations

- **Keyboard Navigation**: All interactive elements focusable
- **Screen Readers**: ARIA labels on all icons and status indicators
- **Color Contrast**: Minimum 4.5:1 for body text, 3:1 for large text
- **Focus Indicators**: Clear 2px outline on focus
- **Reduced Motion**: Respect `prefers-reduced-motion` media query

## Implementation Priority

### Phase 1 (High Impact)
1. Enhanced stats cards with better visual hierarchy
2. Improved service cards with status indicators
3. Better dark mode colors
4. Responsive grid layouts

### Phase 2 (Medium Impact)
5. Tab navigation improvements
6. Table enhancements (sticky headers, sorting)
7. Animation and micro-interactions
8. Mobile optimizations

### Phase 3 (Polish)
9. Sparkline charts for historical data
10. Advanced camera controls
11. Smart home grouping
12. Search functionality

## Design Resources

- **Color Palette**: See `index.css` for current HSL values
- **Icons**: Lucide React icon set (https://lucide.dev)
- **Typography**: System font stack for performance
- **Spacing Scale**: 4px base unit (4, 8, 12, 16, 20, 24, 32, 48, 64px)

## Notes for Figma

1. Use auto-layout for all components (enables easy resizing)
2. Create component variants for states (default, hover, active, disabled)
3. Use design tokens as styles (colors, text styles, effects)
4. Create responsive frames for mobile, tablet, desktop
5. Use constraints for elements that should stretch/fix in layouts
6. Export assets at 2x resolution for crisp display
