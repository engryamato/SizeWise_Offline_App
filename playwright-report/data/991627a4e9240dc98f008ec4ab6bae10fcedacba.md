# Page snapshot

```yaml
- banner "Top navigation"
- heading "Dashboard" [level=1]
- text: Select a tool or open a project.
- link "Available Air Duct Sizer Draw ducts. Live airflow & pressure.":
  - /url: /tools/air-duct-sizer/
  - text: Available
  - heading "Air Duct Sizer" [level=3]
  - text: Draw ducts. Live airflow & pressure.
- text: Coming soon
- heading "Grease Duct Sizer" [level=3]
- text: NFPA 96 ruleset
- heading "Projects" [level=3]
- button "New Project"
- text: No projects yet. Create one to get started.
- button "Create Your First Project"
- heading "Create New Project" [level=2]
- button "×"
- text: Project Name *
- textbox "Project Name *": Test Project
- text: Category
- combobox "Category":
  - option "Residential" [selected]
  - option "Commercial"
  - option "Industrial"
- text: Description
- textbox "Description": This is a test project
- text: Unit System
- combobox "Unit System":
  - option "Imperial (ft, in, cfm)" [selected]
  - option "SI (m, mm, m³/s)"
- text: Failed to create project. Please try again.
- button "Cancel"
- button "Create Project"
- alert
```