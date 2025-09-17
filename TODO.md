# TODO: Add Filter in Chart Page

- [x] Update backend/main.py /tasks endpoint to accept optional query parameters (status, assign, startdate, enddate) and apply filters in MongoDB query.
- [x] Add filter UI controls in charts.html (status dropdown, assignee dropdown, start/end date inputs) above the charts section.
- [x] Modify charts.html JavaScript to populate assignee dropdown dynamically from all tasks.
- [x] Update loadChartData function to read filter values and send as query parameters to /tasks API.
- [x] Add event listeners on filter controls to reload chart data on change.
