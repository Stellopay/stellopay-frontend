# Iconography Guidelines

## Preferred Library

- Primary: lucide-react
- Secondary: @hugeicons/react (only if missing)
- Avoid: react-icons
- Avoid raw SVG unless required

---

## Import Rules (Tree-shaking)

✅ Good:
import { Home } from "lucide-react";

❌ Bad:
import * as Icons from "lucide-react";

---

## Size System

- Small: 16px
- Default: 20px
- Large: 24px

---

## Stroke Width

- Default: 2
- Keep consistent across app

---

## Usage Rules

| Case | Library |
|------|--------|
| UI icons | lucide-react |
| Missing icons | hugeicons |
| Brand/custom | SVG |

---

## Migration Strategy

- Replace react-icons → lucide-react
- Normalize size (20px default)
- Remove inconsistent SVG usage