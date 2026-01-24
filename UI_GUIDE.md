# UI/UX Guide - Employee Loan Management System

## Design System

### Color Palette
```
Primary: Blue (#0066ff)  - Main actions, headers
Secondary: Indigo (#4f46e5) - Gradients, accents
Success: Green (#10b981) - Approvals, positive
Warning: Yellow (#f59e0b) - Pending, caution
Danger: Red (#ef4444) - Rejected, negative
Neutral: Gray (#6b7280) - Text, backgrounds
```

### Typography
- **Font Family**: Geist (default system font)
- **Headings**: Bold, 24-32px
- **Body Text**: Regular, 14-16px
- **Line Height**: 1.5-1.6

### Spacing
- Uses Tailwind scale: 4px, 8px, 16px, 24px, 32px...
- Gaps between elements: 16px standard
- Padding: 16-32px for containers
- Margins: 8-24px for sections

### Border Radius
- Small elements: 4px
- Standard: 8px
- Large: 12px
- Full rounded: 9999px

## Page Layouts

### Login Page
```
┌─────────────────────────────────────┐
│                                     │
│     Logo + Title + Description      │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   Login/Signup Card          │  │
│  │                              │  │
│  │  Email Input                 │  │
│  │  Password Input              │  │
│  │  [Role Select - if signup]   │  │
│  │                              │  │
│  │  [Sign In / Create Account]  │  │
│  │  [Toggle Auth Mode]          │  │
│  │                              │  │
│  │  ─────────────────────────   │  │
│  │  Demo Credentials Info       │  │
│  └──────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

### Manager Dashboard
```
┌─────────────────────────────────────────────────┐
│  Dashboard Title          │ Email | Logout      │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐   │
│  │Total  │  │Pending│  │Approv │  │Rejected│  │
│  │  15   │  │   3   │  │  10   │  │   2    │  │
│  └───────┘  └───────┘  └───────┘  └───────┘   │
│                                                 │
│  Filter: [All][Pending][Approved][Rejected]    │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ Applicant │ Email │ Amount │ Status │... │  │
│  ├──────────────────────────────────────────┤  │
│  │ John      │ john@ │ 100k  │Pending │... │  │
│  │ Sarah     │ sara@ │ 75k   │Approved│..│  │
│  │ Mike      │ mike@ │ 50k   │Rejected│..│  │
│  │ ...       │  ... │  ...  │  ...   │... │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Staff Dashboard
```
┌─────────────────────────────────────────────────┐
│  Staff Loan Management    │ Email │ Logout      │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ Name: John Doe       │ Salary: ₹50,000  │  │
│  │ Department: Sales    │ Employee ID: E01 │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐   │
│  │Total  │  │Pending│  │Approv │  │Borrowed│  │
│  │  3    │  │   1   │  │  2    │  │  500k  │  │
│  └───────┘  └───────┘  └───────┘  └───────┘   │
│                                                 │
│  [+ Apply for New Loan]                        │
│                                                 │
│  Your Loan Applications                        │
│  ┌──────────────────────────────────────────┐  │
│  │ Loan Application              │ Pending  │  │
│  │ Amount: ₹100,000  EMI: ₹8,700 │          │  │
│  │ Duration: 12 months  8% Rate  │          │  │
│  │ Applied: Jan 15, 2026         │          │  │
│  │                  [View Details]           │  │
│  │                                          │  │
│  │ Loan Application              │Approved │  │
│  │ Amount: ₹75,000   EMI: ₹6,525 │          │  │
│  │ Duration: 12 months  8% Rate  │          │  │
│  │ Applied: Jan 10, 2026         │          │  │
│  │                  [View Details]           │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Loan Application Form
```
┌──────────────────────────────────────┐
│  Apply for Loan                      │
├──────────────────────────────────────┤
│                                      │
│  Loan Amount                         │
│  ┌──────────────────────────────┐   │
│  │ 50000 ₹                      │   │
│  │ Max: ₹1,000,000              │   │
│  └──────────────────────────────┘   │
│                                      │
│  Loan Term (Months) │ Interest Rate  │
│  ┌───────────────┐  │  ┌──────────┐ │
│  │ 12            │  │  │ 8 %      │ │
│  └───────────────┘  │  └──────────┘ │
│                                      │
│  Monthly EMI                         │
│  ┌──────────────────────────────┐   │
│  │ ₹4,289 (calculated)          │   │
│  └──────────────────────────────┘   │
│                                      │
│  Reason for Loan                     │
│  ┌──────────────────────────────┐   │
│  │ [Multiple line text area]    │   │
│  │ [Text...]                    │   │
│  └──────────────────────────────┘   │
│                                      │
│  Loan Summary                        │
│  ├─ Total: ₹50,000                  │
│  ├─ EMI: ₹4,289/month                │
│  ├─ Duration: 12 months             │
│  └─ Total to Pay: ₹51,468            │
│                                      │
│  [Submit Application]  [Cancel]      │
│                                      │
└──────────────────────────────────────┘
```

### Approval Modal
```
┌────────────────────────────────────┐
│ Loan Application Review        [X] │
├────────────────────────────────────┤
│                                    │
│ Applicant: John Doe                │
│ Email: john@example.com            │
│                                    │
│ Loan Amount: ₹100,000              │
│ Monthly Income: ₹50,000            │
│ Monthly EMI: ₹8,700                │
│ EMI to Income: 17.4%               │
│                                    │
│ Reason for Loan:                   │
│ "Personal emergency funds"         │
│                                    │
│ ┌──────────────────┐               │
│ │  [Approve]       │               │
│ │  [Reject]        │               │
│ └──────────────────┘               │
│                                    │
│ If Reject:                         │
│ ┌──────────────────────────────┐   │
│ │ Reason for rejection...      │   │
│ │ [Multiple line area]         │   │
│ └──────────────────────────────┘   │
│ [Confirm] [Cancel]                 │
│                                    │
└────────────────────────────────────┘
```

### Loan Details Modal
```
┌────────────────────────────────────┐
│ Loan Details                   [X] │
├────────────────────────────────────┤
│                                    │
│ John Doe                  │Pending │
│                                    │
│ ┌─────────────────────────────┐   │
│ │ Loan Amount: ₹100,000       │   │
│ │ Monthly Income: ₹50,000     │   │
│ │ Monthly EMI: ₹8,700         │   │
│ │ Interest Rate: 8%           │   │
│ │ Loan Term: 12 months        │   │
│ │ Total Interest: ₹4,400      │   │
│ └─────────────────────────────┘   │
│                                    │
│ Loan Reason                        │
│ "Personal emergency funds"         │
│                                    │
│ Repayment Schedule (First 6mo)    │
│ ┌──────────────────────────────┐  │
│ │Mo│EMI  │Principal│Interest   │  │
│ ├──┼─────┼─────────┼───────────┤  │
│ │1 │8700 │7900     │800        │  │
│ │2 │8700 │7937     │763        │  │
│ │..│    │         │           │  │
│ │6 │8700 │8073     │627        │  │
│ └──────────────────────────────┘  │
│ [Showing 6 of 12 months]           │
│                                    │
└────────────────────────────────────┘
```

## Component States

### Status Badge States
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Pending      │  │ Approved     │  │ Rejected     │  │ Disbursed    │
│ [Yellow bg]  │  │ [Green bg]   │  │ [Red bg]     │  │ [Blue bg]    │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

### Button States
```
Normal:     [Click me]      
Hover:      [Click me] (darker, shadow)
Active:     [Click me] (pressed effect)
Disabled:   [Click me] (grayed out)
Loading:    [Processing...] (spinner)
```

### Input States
```
Empty:      ┌──────────┐
            │          │
            └──────────┘

Filled:     ┌──────────┐
            │ Text...  │
            └──────────┘

Focus:      ┌──────────┐  (blue border)
            │ Text...  │
            └──────────┘

Error:      ┌──────────┐  (red border)
            │ Text...  │
            └──────────┘
            Error message below
```

## Responsive Breakpoints

### Mobile (< 768px)
- Single column layout
- Full-width inputs
- Stack cards vertically
- Smaller fonts (14px)
- Reduced padding (12px)

### Tablet (768px - 1024px)
- 2 column layout where applicable
- Standard spacing
- Medium fonts (15px)
- Balanced padding (16px)

### Desktop (> 1024px)
- Multi-column layouts
- Side-by-side components
- Larger fonts (16px)
- Generous padding (24px)

## Color Usage

### Status Indicators
```
Pending:    Yellow (#f59e0b)  - Needs attention
Approved:   Green (#10b981)   - Successful
Rejected:   Red (#ef4444)     - Failed
Disbursed:  Blue (#0066ff)    - Completed
```

### UI Elements
```
Headers:        Blue gradient
Buttons:        Blue/Indigo gradient
Borders:        Light gray
Backgrounds:    White/Light blue
Text:           Dark gray/charcoal
Links:          Blue
Disabled:       Light gray
```

## Interactive Elements

### Cards
- Shadow on normal state
- Slight lift on hover
- Smooth 200ms transition
- Border on focus (for accessibility)

### Buttons
- Full width on mobile
- Inline on desktop
- Rounded 8px corners
- 16px padding (vertical)
- 24px padding (horizontal)

### Inputs
- 12px padding
- 8px border radius
- Blue focus ring
- Clear placeholder text
- Character count (if needed)

### Modals
- Dark overlay (50% black)
- Smooth fade animation
- 200ms duration
- Close button (X) on top-right
- Centered on screen

## Typography Usage

### Headings
- H1 (32px bold): Page titles
- H2 (24px bold): Section headers
- H3 (18px semibold): Subsections
- H4 (16px semibold): Component titles

### Body Text
- Regular (16px): Main content
- Small (14px): Secondary info
- Smaller (12px): Captions, hints

### Special
- Monospace (12px): Code, IDs
- All caps (12px): Labels, badges

## Spacing System

### Vertical Spacing
- Between sections: 32px
- Between groups: 24px
- Between items: 16px
- Between elements: 8px

### Horizontal Spacing
- Page padding: 24px
- Container padding: 16px
- Element padding: 12px
- Icon spacing: 8px

## Accessibility

✅ **Color Contrast**
- All text meets WCAG AA standards
- Color not sole indicator
- Status badges have icons/text

✅ **Interactive Elements**
- Minimum 44px touch targets
- Clear focus indicators
- Keyboard navigation support

✅ **Text**
- Line height 1.5+ for body text
- Font sizes ≥ 14px minimum
- Clear, simple language

✅ **Images & Icons**
- Alt text provided
- Decorative images marked
- Icon + text combinations

## Dark Mode (Future)

The system uses CSS custom properties for easy dark mode implementation:
```css
--color-background: light/dark
--color-foreground: dark/light
--color-primary: blue/lighter-blue
--color-neutral: grays
```

## Performance Considerations

✅ **Optimized Design**
- No heavy animations
- Simple transitions (200ms)
- Hardware-accelerated where possible
- Minimal reflows/repaints

✅ **Image Optimization**
- SVG icons where possible
- Optimized PNGs for images
- Lazy loading for modals

✅ **Asset Size**
- Tailwind CSS purged
- No unused styles
- Minified JavaScript
- Optimized font loading

---

This design system ensures a **consistent, professional, and accessible** user experience across the entire Employee Loan Management System.
