# Page snapshot

```yaml
- alert
- main:
  - heading "Welcome" [level=1]
  - paragraph: Create a PIN to protect your projects (offline).
  - text: PIN (6–10 digits)
  - textbox "PIN (6–10 digits)"
  - text: Confirm PIN
  - textbox "Confirm PIN"
  - group "Biometrics":
    - text: Biometrics
    - radio "Enable biometrics now (Touch ID / Windows Hello)" [checked]
    - text: Enable biometrics now (Touch ID / Windows Hello)
    - radio "I’ll add biometrics later"
    - text: I’ll add biometrics later
  - button "Create PIN & Continue"
```